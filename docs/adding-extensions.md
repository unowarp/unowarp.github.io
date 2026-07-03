# Adding Extensions

This repository expects each extension as a JavaScript file under [src/extensions](../src/extensions), typically:

```text
src/extensions/USERNAME/EXTENSION.js
```

Also add the relative path to [src/extensions.json](../src/extensions.json), for example:

```json
["username/my-extension.js"]
```

## Required metadata header

Each extension file should start with comment metadata so the gallery can render card details.

Example:

```js
// Name: My Extension
// ID: myextension
// Description: Adds useful blocks for something.
// By: Your Name <https://github.com/yourname>
// License: MIT
// Version: 1.0.0
// Created: 7/3/2026
```

Supported optional repeated field:

- `Original`: Original author/project credit. Can appear multiple times.

Example:

```js
// Original: Other Author <https://example.com>
// Original: Another Author <https://example.org>
```

## Style and safety checks

Run these before opening a pull request:

```sh
npm run lint
npm run format:check
```

If your extension intentionally requires exceptions for custom ESLint extension rules, document the reason in code comments where disabled.
