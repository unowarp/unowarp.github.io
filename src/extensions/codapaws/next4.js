// Name: Next4
// ID: codaNext4
// Description: Give your Scratch projects a persistent, volume-based virtual file system.
// By: Coda <https://github.com/codapaws>
// Original: KaneCoded <https://github.com/kanecoded>
// License: LGPL-3.0-only

// Version: 0.1.0
// Created: 7/3/2026

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Next4 must be run unsandboxed.");
  }

  class Next4Extension {
    constructor() {
      this.lastError = "";
      // Persistent locks will be loaded on demand during the first file system execution
      this.locks = {};
      this.locksLoaded = false;
    }

    getInfo() {
      return {
        id: "codaNext4",
        name: Scratch.translate("Next4"),
        color1: "#d65c5c",
        blocks: [
          {
            opcode: "driveActionBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] drive [DRIVE]"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "driveActions",
              },
              DRIVE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://",
              },
            },
          },
          {
            opcode: "driveTransferBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] drive [DRIVE1] to drive [DRIVE2]"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "transferActions",
              },
              DRIVE1: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://",
              },
              DRIVE2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "backup://",
              },
            },
          },
          {
            opcode: "importDrive",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("import drive [DRIVE] JSON [JSON]"),
            arguments: {
              DRIVE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://",
              },
              JSON: { type: Scratch.ArgumentType.STRING, defaultValue: "{}" },
            },
          },
          {
            opcode: "exportDrive",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("export drive [DRIVE]"),
            arguments: {
              DRIVE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://",
              },
            },
          },
          {
            opcode: "allDrives",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("all drives"),
          },
          "---",
          {
            opcode: "fileActionBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] file/directory [PATH]"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "fileActions",
              },
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://folder/",
              },
            },
          },
          {
            opcode: "writeFile",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] [FORMAT] contents [CONTENTS] to file [PATH]"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "writeActions",
              },
              FORMAT: { type: Scratch.ArgumentType.STRING, menu: "formats" },
              CONTENTS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello World!",
              },
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
            },
          },
          {
            opcode: "transferFileBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] file/directory [PATH1] to [PATH2]"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "transferActions",
              },
              PATH1: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
              PATH2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file2.txt",
              },
            },
          },
          {
            opcode: "readFile",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("read file [PATH]"),
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
            },
          },
          "---",
          {
            opcode: "lockBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] file/directory [PATH] in [MODE]"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "lockActions",
              },
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
              MODE: { type: Scratch.ArgumentType.STRING, menu: "lockModes" },
            },
          },
          {
            opcode: "isLocked",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate("is file/directory [PATH] locked?"),
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
            },
          },
          {
            opcode: "unlockAll",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("unlock all files in drive [DRIVE]"),
            arguments: {
              DRIVE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://",
              },
            },
          },
          "---",
          {
            opcode: "listFiles",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("list files in directory [PATH]"),
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://",
              },
            },
          },
          {
            opcode: "doesExist",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate("does file/directory [PATH] exist?"),
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
            },
          },
          "---",
          {
            opcode: "totalSize",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("total size of file/directory [PATH] in bytes"),
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
            },
          },
          {
            opcode: "isType",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("is file/directory [PATH] a file or directory?"),
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "system://file.txt",
              },
            },
          },
          {
            opcode: "getLastError",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("last error"),
            disableMonitor: true,
          },
        ],
        menus: {
          driveActions: {
            acceptReporters: false,
            items: ["create", "format", "delete"],
          },
          transferActions: {
            acceptReporters: false,
            items: ["rename", "copy"],
          },
          fileActions: { acceptReporters: false, items: ["create", "delete"] },
          writeActions: { acceptReporters: false, items: ["write", "append"] },
          formats: {
            acceptReporters: false,
            items: ["plaintext", "data: uri", "base64"],
          },
          lockActions: { acceptReporters: false, items: ["lock", "unlock"] },
          lockModes: {
            acceptReporters: false,
            items: ["shallow mode", "cascading mode"],
          },
        },
      };
    }

    async _loadLocks() {
      try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle(".locks.json", {
          create: false,
        });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        this.locks = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch (e) {
        // File doesn't exist or is invalid, default to empty
        this.locks = {};
      }
      this.locksLoaded = true;
    }

    async _saveLocks() {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(".locks.json", {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(this.locks));
      await writable.close();
    }

    async _exec(defaultValue, func) {
      try {
        if (!navigator.storage || !navigator.storage.getDirectory) {
          throw new Error("OPFS is not supported in this browser.");
        }
        if (!this.locksLoaded) {
          await this._loadLocks();
        }
        const result = await func();
        this.lastError = "";
        return result === undefined ? defaultValue : result;
      } catch (e) {
        console.warn("[Drives VFS Error]", e);
        this.lastError = e.message || String(e);
        return defaultValue;
      }
    }

    _parseURI(uri) {
      uri = String(uri);
      const isDirectoryTarget = uri.endsWith("/");
      const match = uri.match(/^([a-zA-Z0-9_ -]+):\/\/(.*)$/);
      if (match) {
        const pathStr = match[2].replace(/^\/+|\/+$/g, "");
        const segments = pathStr.split("/").filter(Boolean);
        const normalizedPath = segments.join("/");
        return {
          drive: match[1],
          path: normalizedPath,
          segments,
          full: normalizedPath ? `${match[1]}://${normalizedPath}` : `${match[1]}://`,
          isDirectoryTarget: isDirectoryTarget,
        };
      }
      if (!uri.includes("://")) {
        return {
          drive: uri,
          path: "",
          segments: [],
          full: `${uri}://`,
          isDirectoryTarget: true,
        };
      }
      throw new Error("Invalid URI format. Expected drive://path");
    }

    _assertDriveOnly(parsedURI) {
      if (parsedURI.path !== "") {
        throw new Error("Drive-only operations do not accept a path component.");
      }
    }

    _checkLock(parsedURI, options = {}) {
      const { descendants = false } = options;
      let currentPath = `${parsedURI.drive}://`;

      // Check root lock
      if (
        this.locks[currentPath] === "cascading" ||
        (this.locks[currentPath] === "shallow" && parsedURI.segments.length === 0)
      ) {
        throw new Error("File or directory is locked.");
      }

      // Check cascading locks down the path
      for (let i = 0; i < parsedURI.segments.length; i++) {
        currentPath += (i === 0 ? "" : "/") + parsedURI.segments[i];
        const isTarget = i === parsedURI.segments.length - 1;

        if (
          this.locks[currentPath] === "cascading" ||
          (this.locks[currentPath] === "shallow" && isTarget)
        ) {
          throw new Error("File or directory (or a parent) is locked.");
        }
      }

      if (descendants) {
        const targetPath = parsedURI.full;
        const prefix = targetPath.endsWith("://") ? targetPath : `${targetPath}/`;

        for (const key in this.locks) {
          if (key.startsWith(prefix)) {
            throw new Error("File or directory is locked.");
          }
        }
      }
    }

    async _getParentAndName(parsedURI, createParents = false) {
      const root = await navigator.storage.getDirectory();
      let current = await root.getDirectoryHandle(parsedURI.drive, {
        create: createParents,
      });

      for (let i = 0; i < parsedURI.segments.length - 1; i++) {
        current = await current.getDirectoryHandle(parsedURI.segments[i], {
          create: createParents,
        });
      }
      const name =
        parsedURI.segments.length > 0 ? parsedURI.segments[parsedURI.segments.length - 1] : "";
      return { parent: current, name: name };
    }

    async _pathExists(parsedURI) {
      try {
        const { parent, name } = await this._getParentAndName(parsedURI, false);
        if (name === "") return true;
        return (await this._getType(parent, name)) !== null;
      } catch (e) {
        return false;
      }
    }

    async _getType(parent, name) {
      if (name === "") return "directory"; // It's the root directory
      try {
        await parent.getDirectoryHandle(name);
        return "directory";
      } catch (e) {}
      try {
        await parent.getFileHandle(name);
        return "file";
      } catch (e) {}
      return null;
    }

    async _copyRecursive(srcParent, srcName, destParent, destName) {
      if (destName !== "" && (await this._getType(destParent, destName)) !== null) {
        throw new Error("Destination already exists.");
      }

      const type = await this._getType(srcParent, srcName);
      if (type === "file") {
        const srcFileHandle = await srcParent.getFileHandle(srcName);
        const file = await srcFileHandle.getFile();

        const destFileHandle = await destParent.getFileHandle(destName, {
          create: true,
        });
        const writable = await destFileHandle.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
      } else if (type === "directory") {
        // If it's a sub-directory, open handles. If it's the root (name=""), it IS the parent handle.
        const srcDir = srcName === "" ? srcParent : await srcParent.getDirectoryHandle(srcName);
        const destDir =
          destName === ""
            ? destParent
            : await destParent.getDirectoryHandle(destName, { create: true });

        for await (const [childName, _handle] of srcDir.entries()) {
          await this._copyRecursive(srcDir, childName, destDir, childName);
        }
      } else {
        throw new Error("Source does not exist.");
      }
    }

    async _getSizeHandle(handle) {
      if (handle.kind === "file") {
        return (await handle.getFile()).size;
      } else {
        let total = 0;
        for await (const [_subName, _subHandle] of handle.entries()) {
          total += await this._getSizeHandle(_subHandle);
        }
        return total;
      }
    }

    async _exportRecursive(dirHandle, pathPrefix = "") {
      let result = {};
      for await (const [name, handle] of dirHandle.entries()) {
        const currentPath = pathPrefix + name;
        if (handle.kind === "file") {
          const file = await handle.getFile();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.readAsDataURL(file);
          });
          result[currentPath] = base64;
        } else {
          result[currentPath + "/"] = null; // Mark as directory
          const subObj = await this._exportRecursive(handle, currentPath + "/");
          Object.assign(result, subObj);
        }
      }
      return result;
    }

    driveActionBlock(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.DRIVE);
        this._assertDriveOnly(parsed);
        const root = await navigator.storage.getDirectory();

        if (args.ACTION === "create") {
          await root.getDirectoryHandle(parsed.drive, { create: true });
        } else if (args.ACTION === "format") {
          this._checkLock(parsed, { descendants: true });
          try {
            await root.removeEntry(parsed.drive, { recursive: true });
          } catch (e) {}
          await root.getDirectoryHandle(parsed.drive, { create: true });

          // Clear locks on this drive
          const prefix = `${parsed.drive}://`;
          for (let key in this.locks) {
            if (key.startsWith(prefix)) delete this.locks[key];
          }
          await this._saveLocks();
        } else if (args.ACTION === "delete") {
          this._checkLock(parsed, { descendants: true });
          await root.removeEntry(parsed.drive, { recursive: true });

          // Clear locks on this drive
          const prefix = `${parsed.drive}://`;
          for (let key in this.locks) {
            if (key.startsWith(prefix)) delete this.locks[key];
          }
          await this._saveLocks();
        }
      });
    }

    driveTransferBlock(args) {
      return this._exec("", async () => {
        const p1 = this._parseURI(args.DRIVE1);
        const p2 = this._parseURI(args.DRIVE2);
        this._assertDriveOnly(p1);
        this._assertDriveOnly(p2);
        this._checkLock(p1, { descendants: args.ACTION === "rename" });
        this._checkLock(p2, { descendants: true });

        if (p1.drive === p2.drive) {
          throw new Error("Source and destination are the same.");
        }
        if (await this._pathExists(p2)) {
          throw new Error("Destination already exists.");
        }

        const root = await navigator.storage.getDirectory();
        const srcDir = await root.getDirectoryHandle(p1.drive, {
          create: false,
        });
        const destDir = await root.getDirectoryHandle(p2.drive, {
          create: true,
        });

        await this._copyRecursive(srcDir, "", destDir, "");

        if (args.ACTION === "rename") {
          await root.removeEntry(p1.drive, { recursive: true });

          // Update persistent locks to match the new drive name
          const oldPrefix = `${p1.drive}://`;
          const newPrefix = `${p2.drive}://`;
          for (let key in this.locks) {
            if (key.startsWith(oldPrefix)) {
              const newKey = newPrefix + key.slice(oldPrefix.length);
              this.locks[newKey] = this.locks[key];
              delete this.locks[key];
            }
          }
          await this._saveLocks();
        }
      });
    }

    importDrive(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.DRIVE);
        this._assertDriveOnly(parsed);
        this._checkLock(parsed, { descendants: true });

        const root = await navigator.storage.getDirectory();
        const tempDrive = `.import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const tempHandle = await root.getDirectoryHandle(tempDrive, {
          create: true,
        });

        try {
          const data = JSON.parse(args.JSON);
          for (const [path, base64] of Object.entries(data)) {
            const segments = path.split("/").filter(Boolean);
            if (segments.length === 0) continue;

            let current = tempHandle;
            for (let i = 0; i < segments.length - 1; i++) {
              current = await current.getDirectoryHandle(segments[i], {
                create: true,
              });
            }

            const name = segments[segments.length - 1];
            if (path.endsWith("/") || base64 === null) {
              await current.getDirectoryHandle(name, { create: true });
            } else {
              const fileHandle = await current.getFileHandle(name, {
                create: true,
              });
              const writable = await fileHandle.createWritable();

              const binStr = atob(base64);
              const bytes = new Uint8Array(binStr.length);
              for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

              await writable.write(bytes);
              await writable.close();
            }
          }

          try {
            await root.removeEntry(parsed.drive, { recursive: true });
          } catch (e) {}
          const driveHandle = await root.getDirectoryHandle(parsed.drive, {
            create: true,
          });
          await this._copyRecursive(tempHandle, "", driveHandle, "");
        } finally {
          try {
            await root.removeEntry(tempDrive, { recursive: true });
          } catch (e) {}
        }
      });
    }

    exportDrive(args) {
      return this._exec("{}", async () => {
        const parsed = this._parseURI(args.DRIVE);
        this._assertDriveOnly(parsed);
        const root = await navigator.storage.getDirectory();
        const driveHandle = await root.getDirectoryHandle(parsed.drive, {
          create: false,
        });
        const result = await this._exportRecursive(driveHandle);
        return JSON.stringify(result);
      });
    }

    _isVisibleDriveName(name) {
      return !!name && !name.startsWith(".") && !name.startsWith(".import-");
    }

    allDrives() {
      return this._exec("[]", async () => {
        const root = await navigator.storage.getDirectory();
        let drives = [];
        for await (const [name, handle] of root.entries()) {
          if (handle.kind === "directory" && this._isVisibleDriveName(name)) {
            drives.push(name);
          }
        }
        return JSON.stringify(drives);
      });
    }

    fileActionBlock(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.PATH);

        if (args.ACTION === "delete") {
          this._checkLock(parsed, { descendants: true });
          const { parent, name } = await this._getParentAndName(parsed, false);
          if (name === "") {
            throw new Error("Cannot delete drive root. Use the delete drive block.");
          }
          await parent.removeEntry(name, { recursive: true });
        } else {
          this._checkLock(parsed);
          const { parent, name } = await this._getParentAndName(parsed, true);
          if (name === "") {
            throw new Error("Cannot create a file or directory directly at the drive root.");
          }
          if (parsed.isDirectoryTarget) {
            await parent.getDirectoryHandle(name, { create: true });
          } else {
            await parent.getFileHandle(name, { create: true });
          }
        }
      });
    }

    writeFile(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.PATH);
        this._checkLock(parsed);
        const { parent, name } = await this._getParentAndName(parsed, true);

        if (name === "") throw new Error("Cannot write file to a drive root directly.");

        let bytes;
        if (args.FORMAT === "plaintext") {
          bytes = new TextEncoder().encode(args.CONTENTS);
        } else if (args.FORMAT === "base64") {
          const binStr = atob(args.CONTENTS);
          bytes = new Uint8Array(binStr.length);
          for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        } else if (args.FORMAT === "data: uri") {
          const contents = String(args.CONTENTS);
          if (!/^data:/i.test(contents)) {
            throw new Error("Expected a data URI.");
          }
          const res = await Scratch.fetch(contents);
          const buf = await res.arrayBuffer();
          bytes = new Uint8Array(buf);
        } else {
          throw new Error("Unsupported file format.");
        }

        const fileHandle = await parent.getFileHandle(name, { create: true });
        const isAppend = args.ACTION === "append";

        const writable = await fileHandle.createWritable({
          keepExistingData: isAppend,
        });

        if (isAppend) {
          const file = await fileHandle.getFile();
          await writable.write({
            type: "write",
            position: file.size,
            data: bytes,
          });
        } else {
          await writable.write(bytes);
        }

        await writable.close();
      });
    }

    transferFileBlock(args) {
      return this._exec("", async () => {
        const p1 = this._parseURI(args.PATH1);
        const p2 = this._parseURI(args.PATH2);
        this._checkLock(p1, { descendants: args.ACTION === "rename" });
        this._checkLock(p2);

        if (p1.full === p2.full) {
          throw new Error("Source and destination are the same.");
        }
        if (await this._pathExists(p2)) {
          throw new Error("Destination already exists.");
        }

        const src = await this._getParentAndName(p1, false);
        const sourceType = await this._getType(src.parent, src.name);
        if (sourceType === "directory") {
          const sourcePrefix = p1.full.endsWith("://") ? p1.full : `${p1.full}/`;
          if (p2.full.startsWith(sourcePrefix)) {
            throw new Error("Cannot transfer a directory into itself or a descendant.");
          }
        }
        const dest = await this._getParentAndName(p2, true);

        await this._copyRecursive(src.parent, src.name, dest.parent, dest.name);

        if (args.ACTION === "rename") {
          await src.parent.removeEntry(src.name, { recursive: true });
        }
      });
    }

    readFile(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.PATH);
        const { parent, name } = await this._getParentAndName(parsed);
        const fileHandle = await parent.getFileHandle(name);
        const file = await fileHandle.getFile();
        const format = args.FORMAT || "plaintext";

        if (format === "base64") {
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        }

        if (format === "data: uri") {
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }

        return await file.text();
      });
    }

    lockBlock(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.PATH);
        if (args.ACTION === "lock") {
          this.locks[parsed.full] = args.MODE === "shallow mode" ? "shallow" : "cascading";
        } else {
          delete this.locks[parsed.full];
        }
        await this._saveLocks();
      });
    }

    isLocked(args) {
      return this._exec(false, () => {
        const parsed = this._parseURI(args.PATH);
        try {
          this._checkLock(parsed);
          return false;
        } catch (e) {
          return true;
        }
      });
    }

    unlockAll(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.DRIVE);
        this._assertDriveOnly(parsed);
        const prefix = `${parsed.drive}://`;
        for (let key in this.locks) {
          if (key.startsWith(prefix)) {
            delete this.locks[key];
          }
        }
        await this._saveLocks();
      });
    }

    listFiles(args) {
      return this._exec("[]", async () => {
        const parsed = this._parseURI(args.PATH);
        const { parent, name } = await this._getParentAndName(parsed);

        const dirHandle = name === "" ? parent : await parent.getDirectoryHandle(name);
        let out = [];
        for await (const [entryName, handle] of dirHandle.entries()) {
          out.push(handle.kind === "directory" ? entryName + "/" : entryName);
        }
        return JSON.stringify(out);
      });
    }

    doesExist(args) {
      return this._exec(false, async () => {
        const parsed = this._parseURI(args.PATH);
        const { parent, name } = await this._getParentAndName(parsed);
        const type = await this._getType(parent, name);
        return type !== null;
      });
    }

    totalSize(args) {
      return this._exec(0, async () => {
        const parsed = this._parseURI(args.PATH);
        const { parent, name } = await this._getParentAndName(parsed);

        if (name === "") {
          return await this._getSizeHandle(parent);
        }

        const type = await this._getType(parent, name);
        if (type === "file") {
          const handle = await parent.getFileHandle(name);
          return (await handle.getFile()).size;
        } else if (type === "directory") {
          const handle = await parent.getDirectoryHandle(name);
          return await this._getSizeHandle(handle);
        }
        return 0;
      });
    }

    isType(args) {
      return this._exec("", async () => {
        const parsed = this._parseURI(args.PATH);
        const { parent, name } = await this._getParentAndName(parsed);
        return (await this._getType(parent, name)) || "";
      });
    }

    getLastError() {
      return this.lastError;
    }
  }

  Scratch.extensions.register(new Next4Extension());
})(Scratch);
