# js.org PR for otkai.js.org

To request the free subdomain `otkai.js.org`, submit a pull request to the js.org repository.

1. Fork https://github.com/js-org/js.org
2. Edit `cnames_active.js` in your fork and add this entry near similar alphabetical keys:

```js
// Oregon Trail KaiOS Edition
"otkai": "coolkid547.github.io/Oregon-Trail-KaiOS-Edition",
```

3. Commit and open a PR to `js-org/js.org` with title:

```
Add otkai.js.org -> coolkid547.github.io/Oregon-Trail-KaiOS-Edition
```

4. PR description (copy-paste):

```
Requesting otkai.js.org for an open-source game project.

Repo: https://github.com/coolkid547/Oregon-Trail-KaiOS-Edition
Pages: https://coolkid547.github.io/Oregon-Trail-KaiOS-Edition/

A CNAME file has been added to the project root.
The site is deployed via GitHub Actions to GitHub Pages.
```

5. After merge, js.org will add DNS. Keep the `CNAME` file as `otkai.js.org`.

Notes:
- Ensure the Pages workflow is green and the site is publicly accessible.
- If you later change repo name or username, update the entry accordingly.
