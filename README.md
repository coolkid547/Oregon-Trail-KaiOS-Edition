# Oregon Trail:KaiOS Edition

Prototype KaiOS-friendly recreation of an Oregon Trail style game.

**Developer:** ChingaApps

## What this is

A small, open prototype intended to run on KaiOS devices or in a desktop browser for testing. It is a simple travel loop with supplies and random events.

## Run locally (quick test)

1. Start a simple HTTP server from the project root:

```bash
cd /workspaces/Oregon-Trail-KaiOS-Edition
python3 -m http.server 8000
```

2. Open `http://localhost:8000` in a browser on your development machine or device.

Use keys `1`, `2`, `3` to choose options.

## New features added

- Save and load: The game autosaves to browser `localStorage`. If a saved game exists you will be offered to continue on the start screen.
- Expanded events: More varied random events, river slowdowns, trading posts, and better messages.
- Audio: Small WebAudio tones play for clicks and events (no external files required).
- Softkey wiring: Left and right softkeys are wired to contextual actions and also respond to clicks in browsers.

## Save slots and custom profiles

- Save slots: The game supports up to 3 save slots. From the start screen choose "Manage save slots" to load, save, or clear individual slots.
- Secret custom profile: There is a hidden custom game builder. Enter the following key sequence on the page to unlock it:

	up up down down left right left right 534

	After entering that sequence the secret builder opens and you can create and save a custom profile, then start the custom game.

### What the secret builder can do

- Create a custom starting profile: set `Miles to Oregon`, `Starting food`, `Party size`, and `Health`.
- Author custom events: add immediate or choice events. Choice events accept two options and simple numeric effects (food deltas, etc.).
- Save the profile in localStorage and start a game using that profile.

### Named save slots

- When saving to slots you can give the slot a name. The slots UI shows the name and timestamp.

### Audio and animation

- The app uses simple WebAudio melodies for win/secret events and small tones for actions. Browsers may require a user gesture before audio plays.
- Unlocking the secret menu shows a brief animation overlay and an editable sprite.

## Azure Pipelines deployment

This project includes an `azure-pipelines.yml` that uploads the site to an Azure Storage static website using the `AzureCLI@2` task.

What you need:
- An Azure subscription with a Storage Account created. Enable the static website feature or let the pipeline enable it for you.
- An Azure DevOps project and a service connection (Azure Resource Manager) with rights to the subscription. Create a service connection and name it (for example) `AzureServiceConnection`.

How to configure the pipeline:

1. In Azure DevOps create a new pipeline pointing at this repository and use the existing `azure-pipelines.yml` file.
2. In the pipeline variables set `AZURE_STORAGE_ACCOUNT` to your storage account name (and optionally `AZURE_RESOURCE_GROUP`).
3. Ensure the pipeline has access to the service connection name you used in the YAML (`AzureServiceConnection`), or update `azure-pipelines.yml` to the correct service connection name.
4. Run the pipeline. It will enable static website hosting and push files to the `$web` container.

Local deploy helper:

You can also deploy locally with the Azure CLI using the included script. Set `AZURE_STORAGE_ACCOUNT` and run:

```bash
chmod +x ./scripts/azure_deploy.sh
AZURE_STORAGE_ACCOUNT=myaccount ./scripts/azure_deploy.sh
```

This requires you to be logged in with `az login` and have contributor privileges on the storage account.

Alternative: Python wrapper (no chmod needed)

If you do not want to change file permissions or prefer a Python option, there is a wrapper that uploads files using the Azure Storage SDK without needing the `scripts/azure_deploy.sh` executable bit.

1. Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

2. Run with a connection string:

```bash
AZURE_STORAGE_CONNECTION_STRING="<connection string>" python3 scripts/azure_deploy_api.py
```

Or run with account and key:

```bash
export AZURE_STORAGE_ACCOUNT=myaccount
export AZURE_STORAGE_KEY=<account key>
python3 scripts/azure_deploy_api.py
```

This uploads `index.html`, `manifest.webapp`, and the `css`, `js`, `icons`, and `assets` folders into the `$web` container and sets content types.

## Provisioning infrastructure from the pipeline

You can optionally let the pipeline provision a Storage Account for you using the included ARM template. To enable this set the pipeline variable `DEPLOY_INFRA` to `true` and configure the following pipeline variables:

- `AZURE_RESOURCE_GROUP` - the resource group name to deploy into (the pipeline will not create a resource group for you; create it beforehand or change the ARM task to create it).
- `AZURE_STORAGE_ACCOUNT` - the storage account name to create (must be globally unique).

Steps to provision via pipeline:
1. Create a Resource Group in your subscription (or change the ARM task to create one):

```bash
az group create -n myResourceGroup -l eastus
```

2. In Azure DevOps, create a pipeline from this repo and set variables:
 - `AZURE_RESOURCE_GROUP` = `myResourceGroup`
 - `AZURE_STORAGE_ACCOUNT` = desired storage account name
 - `DEPLOY_INFRA` = `true`
3. Ensure the pipeline's service connection (ARM) has permission to create resources in the subscription.
4. Run the pipeline. The `ProvisionInfra` stage will deploy the ARM template, then the `Deploy` stage will enable static website and upload files.

If you want me to also add a step that creates the resource group automatically in the pipeline, I can add that as well.




## Package for KaiOS

1. Ensure `manifest.webapp` and the site root files are present.
2. Create a zip with the site files (icons should be in `icons/`):

```bash
zip -r oregon-trail-kaios.zip index.html css js manifest.webapp icons README.md
```

3. Upload or sideload the zip to a KaiOS device or emulator according to the platform documentation.

## Notes & next steps

- This is a prototype. Next improvements: deeper event trees, art and audio, save state, multiple routes.
- No em-dash characters were used in code files.
