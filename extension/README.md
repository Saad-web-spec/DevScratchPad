# DevScratchpad JSON Formatter - Chrome Extension

This extension provides an aggressive, automatic traffic funnel to DevScratchpad.

Whenever a user visits a raw JSON URL (e.g. an API endpoint like `https://api.github.com/users/octocat`), Chrome displays raw unformatted text. This extension intercepts that raw text, formats it beautifully in a dark-mode UI, and injects a prominent "Edit in DevScratchpad" CTA button. 

By distributing this extension on the Chrome Web Store for free, you intercept developers doing daily API debugging and funnel them directly into your web workspace.

## How to Test Locally

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Turn on **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked**.
5. Select this `extension` folder.
6. Visit any raw JSON endpoint (e.g. `https://jsonplaceholder.typicode.com/todos/1`) in your browser to see it in action!

## Publishing to the Chrome Web Store

1. Create a 128x128 icon and a 48x48 icon. Update `manifest.json` to include them.
2. Zip this entire directory.
3. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Pay the one-time $5 developer fee.
5. Upload the zip file, add some nice screenshots, and publish!

*Pro-tip for growth:* Once published, you can embed a badge on the DevScratchpad README and landing page saying "Install our JSON Formatter Extension."
