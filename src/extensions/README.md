# extensions/

Store extension files in this folder using this scheme:

```text
src/extensions/USERNAME/EXTENSION.js
```

When adding a file here, add an entry to `src/extensions.json` that is relative
to `src/extensions/` (without the `src/extensions/` prefix).

Example entry format:

```json
["USERNAME/EXTENSION.js"]
```
