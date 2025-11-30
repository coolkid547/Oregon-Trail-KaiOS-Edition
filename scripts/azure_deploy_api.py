#!/usr/bin/env python3
"""
Upload static site files to Azure Storage '$web' container using the Azure Storage SDK.

Supports authentication via either:
 - AZURE_STORAGE_CONNECTION_STRING, or
 - AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY

Usage examples:
  pip install -r requirements.txt
  AZURE_STORAGE_CONNECTION_STRING="<conn str>" python3 scripts/azure_deploy_api.py

Or:
  export AZURE_STORAGE_ACCOUNT=myaccount
  export AZURE_STORAGE_KEY=<account key>
  python3 scripts/azure_deploy_api.py

This script uploads files matching these paths:
  index.html, css/*, js/*, icons/*, assets/*, manifest.webapp

It will create the '$web' container if needed and set content types.
"""

import os
import sys
import mimetypes
from pathlib import Path
from azure.storage.blob import BlobServiceClient, ContentSettings

# Optional management imports
try:
    from azure.identity import DefaultAzureCredential
    from azure.mgmt.storage import StorageManagementClient
    from azure.mgmt.resource import ResourceManagementClient
    MGMT_AVAILABLE = True
except Exception:
    MGMT_AVAILABLE = False

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = [
    "index.html",
    "manifest.webapp",
    "css",
    "js",
    "icons",
    "assets",
]

def get_blob_service_client():
    conn = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
    if conn:
        return BlobServiceClient.from_connection_string(conn)
    account = os.environ.get('AZURE_STORAGE_ACCOUNT')
    key = os.environ.get('AZURE_STORAGE_KEY')
    if account and key:
        url = f"https://{account}.blob.core.windows.net"
        return BlobServiceClient(account_url=url, credential=key)
    print('Error: set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY', file=sys.stderr)
    sys.exit(2)


def ensure_resource_group(subscription_id, rg_name, location):
    if not MGMT_AVAILABLE:
        print('Management libraries not installed; cannot create resource group', file=sys.stderr)
        return
    cred = DefaultAzureCredential()
    rmc = ResourceManagementClient(cred, subscription_id)
    print(f'Creating or updating resource group {rg_name} in {location}...')
    rmc.resource_groups.create_or_update(rg_name, {'location': location})


def enable_static_website(subscription_id, resource_group, account_name, index_document='index.html', error_document='index.html'):
    if not MGMT_AVAILABLE:
        print('Management libraries not installed; cannot enable static website', file=sys.stderr)
        return
    cred = DefaultAzureCredential()
    storage_mgmt = StorageManagementClient(cred, subscription_id)
    print(f'Enabling static website on storage account {account_name}...')
    # The SDK expects BlobServiceProperties object; using dict should work
    props = {
        'static_website': {
            'enabled': True,
            'index_document': index_document,
            'error_document_404_path': error_document
        }
    }
    try:
        storage_mgmt.blob_services.set_service_properties(resource_group_name=resource_group, account_name=account_name, parameters=props)
    except Exception as e:
        # Some SDK versions use different method signature; try an alternative call
        try:
            storage_mgmt.blob_services.set_service_properties(account_name, props, resource_group)
        except Exception as e2:
            print('Failed to set static website properties via management API:', e, e2, file=sys.stderr)
            return
    print('Static website enabled (management API).')

def collect_files(root: Path):
    files = []
    for p in PATTERNS:
        candidate = root / p
        if candidate.is_file():
            files.append(candidate)
        elif candidate.is_dir():
            for f in candidate.rglob('*'):
                if f.is_file():
                    files.append(f)
    # ensure deterministic ordering
    files = sorted(set(files))
    return files

def upload_files(service: BlobServiceClient, files, account_name=None):
    container_name = '$web'
    try:
        container_client = service.get_container_client(container_name)
        if not container_client.exists():
            container_client.create_container()
    except Exception as e:
        # best effort create
        container_client = service.get_container_client(container_name)
        try:
            container_client.create_container()
        except Exception:
            pass

    for f in files:
        # compute blob name relative to root
        blob_name = str(f.relative_to(ROOT)).replace('\\', '/')
        content_type, _ = mimetypes.guess_type(f.name)
        if not content_type:
            content_type = 'application/octet-stream'
        print(f'Uploading {f} -> {blob_name} ({content_type})')
        with open(f, 'rb') as fh:
            try:
                container_client.upload_blob(name=blob_name, data=fh, overwrite=True,
                    content_settings=ContentSettings(content_type=content_type))
            except Exception as e:
                print('Failed uploading', blob_name, 'error:', e, file=sys.stderr)

def main():
    # Optional management actions
    subscription_id = os.environ.get('AZURE_SUBSCRIPTION_ID')
    rg = os.environ.get('AZURE_RESOURCE_GROUP') or os.environ.get('RESOURCE_GROUP')
    location = os.environ.get('AZURE_LOCATION') or os.environ.get('LOCATION') or 'eastus'
    enable_site = os.environ.get('ENABLE_STATIC_WEBSITE', 'false').lower() in ('1', 'true', 'yes')
    create_rg = os.environ.get('CREATE_RESOURCE_GROUP', 'false').lower() in ('1', 'true', 'yes')

    if create_rg:
        if not subscription_id or not rg:
            print('To create a resource group set AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP (or RESOURCE_GROUP)', file=sys.stderr)
            sys.exit(2)
        ensure_resource_group(subscription_id, rg, location)

    if enable_site:
        if not subscription_id or not rg:
            print('To enable static website via management API set AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP (or RESOURCE_GROUP)', file=sys.stderr)
            sys.exit(2)
        # Determine account name
        account = os.environ.get('AZURE_STORAGE_ACCOUNT')
        if not account:
            print('AZURE_STORAGE_ACCOUNT is required to enable static website', file=sys.stderr)
            sys.exit(2)
        enable_static_website(subscription_id, rg, account)

    service = get_blob_service_client()
    files = collect_files(ROOT)
    if not files:
        print('No files found to upload. Are you in the project root?')
        sys.exit(1)
    upload_files(service, files)
    print('Upload complete.')

if __name__ == '__main__':
    main()
