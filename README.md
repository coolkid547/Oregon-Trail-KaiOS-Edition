# Oregon Trail:KaiOS Edition

Prototype KaiOS-friendly recreation of an Oregon Trail style game.

**Developer:** ChingaApps

## What this is

A small, open prototype intended to run on KaiOS devices or in a desktop browser for testing. It is a simple travel loop with supplies and random events.

## Run locally (quick test)

1. Start a simple HTTP server from the project root:

```bash
chmod +x ./scripts/serve.sh
./scripts/serve.sh 8000
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

## GitHub Pages deployment

This project is now set up to deploy via GitHub Pages using GitHub Actions (`.github/workflows/pages.yml`). It publishes the repository root as a static site.

How it works:
- On every push to `main`, the workflow uploads the site content and deploys to GitHub Pages.
- No build step is required; it serves `index.html` and the `css`, `js`, `icons`, and `assets` folders.

Enable Pages in the repository settings:
1. In GitHub, open your repository → Settings → Pages.
2. Set “Build and deployment” → Source to “GitHub Actions”.
3. Save. After the next push to `main`, Pages will publish.

The deployment URL will appear in the Actions run summary under the “Deploy to GitHub Pages” step and in the repository “Environments → github-pages”.

Custom domain (free via js.org, optional):
- This repo is configured with `otkai.js.org` in the `CNAME` file. To activate, request a free subdomain from js.org:
	1. Fork `https://github.com/js-org/js.org` and edit `cnames_active.js` to add: `"otkai": "coolkid547.github.io/Oregon-Trail-KaiOS-Edition"`.
	2. Open a PR with your change and a brief description linking to this repository.
	3. After the PR is merged, js.org will add DNS for `otkai.js.org`. GitHub Pages will serve your site at that subdomain.
  
Alternatively, you can remove the `CNAME` file and use the default Pages URL: `https://coolkid547.github.io/Oregon-Trail-KaiOS-Edition/`.

Workflow publishes only site files:
- The Pages workflow builds a `dist/` directory containing `index.html`, `manifest.webapp`, `.nojekyll`, and the `css/`, `js/`, `icons/`, and `assets` folders, then deploys that artifact. Other repo files (like README) are excluded from the published site.




## Package for KaiOS

1. Ensure `manifest.webapp` and the site root files are present.
2. Create a zip with the site files (icons should be in `icons/`):

```bash
zip -r oregon-trail-kaios.zip index.html css js manifest.webapp icons README.md
```

3. Upload or sideload the zip to a KaiOS device or emulator according to the platform documentation.

## Notes & next steps

- This is a prototype. Next improvements: deeper event trees, art and audio, save state, multiple routes.
- GitHub Pages replaces Azure hosting; Azure-specific files have been removed.
- No em-dash characters were used in code files.
