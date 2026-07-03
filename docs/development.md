# Development Guide

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer

## Install dependencies

```sh
npm install
```

## Run local site

```sh
npm start
```

This serves [src](../src) at [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Lint and format

```sh
npm run lint
npm run format:check
```

Available scripts from [package.json](../package.json):

- `npm run lint:eslint` for JavaScript linting
- `npm run lint:html` for HTML linting
- `npm run lint:md` for Markdown linting
- `npm run format` to apply Prettier formatting
- `npm run format:check` to verify formatting

## ESLint behavior

The repository uses flat-config ESLint in [eslint.config.mjs](../eslint.config.mjs), including custom esquery-based extension rules for files matching `src/extensions/**/*.js`.

## Common workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Run lint and format checks.
4. Open a pull request with a clear summary and testing notes.
