# UnoWarp Extensions Overview

UnoWarp Extensions is a static web gallery for discovering and downloading unsandboxed UnoWarp extension files contributed by the community.

## What the site does

- Loads extension file paths from [src/extensions.json](../src/extensions.json).
- Fetches each extension file from [src/extensions](../src/extensions/).
- Parses metadata from top-of-file comments (for example: `Name`, `Description`, `By`, `License`, `Version`, `Created`).
- Renders extension cards with search support.
- Marks recently created extensions as **NEW** when the `Created` date is within 30 days.

## Project layout

- [src/index.html](../src/index.html): Main application page, UI, and all client-side logic.
- [src/extensions.json](../src/extensions.json): Ordered list of extension file paths rendered in the gallery.
- [src/extensions/README.md](../src/extensions/README.md): Extension path naming convention.
- [assets/icon.svg](../assets/icon.svg): Repository icon used in docs.

## Data flow

1. On page load, the app fetches UTC time from WorldTimeAPI (falls back to local time if unavailable).
2. It fetches [src/extensions.json](../src/extensions.json).
3. For each listed file, it fetches and parses metadata headers.
4. It renders cards, search index, and the new-extension marquee.

## Runtime expectations

The app must be served over HTTP/HTTPS. Opening [src/index.html](../src/index.html) via `file://` will fail because browser CORS rules block fetch calls.
