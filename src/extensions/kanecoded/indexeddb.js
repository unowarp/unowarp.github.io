// Name: IndexedDB
// ID: indexeddb
// Description: Store data persistently using IndexedDB. Like cookies, but better.
// By: KaneCoded <https://github.com/kanecoded>
// Original: infernostars
// Original: GarboMuffin
// License: LGPL-3.0-only

// Version: 0.1.0
// Created: 7/4/2026

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("IndexedDB must be run unsandboxed");
  }

  const DB_NAME = "TurboWarp_ExtensionStorage";
  const STORE_NAME = "indexeddb";
  let dbPromise = null;

  const initDB = () => {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
          e.target.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    }
    return dbPromise;
  };

  const idbGet = async (key) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const idbSet = async (key, value) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const request = tx.objectStore(STORE_NAME).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const idbRemove = async (key) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const request = tx.objectStore(STORE_NAME).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };
  // -------------------------

  const getNamespace = () => Scratch.vm.runtime.extensionStorage["indexeddb"]?.namespace;

  let syncPromise = Promise.resolve();

  /**
   * @param {string} newNamespace
   */
  const setNamespace = (newNamespace) => {
    Scratch.vm.runtime.extensionStorage["indexeddb"] = {
      namespace: newNamespace,
    };
    syncPromise = readFromStorage();

    if (Scratch.vm.extensionManager.isExtensionLoaded("indexeddb")) {
      Scratch.vm.extensionManager.refreshBlocks("indexeddb");
    }
  };

  const STORAGE_PREFIX = "extensions.turbowarp.org/indexeddb:";
  const getStorageKey = () => `${STORAGE_PREFIX}${getNamespace()}`;

  /**
   * Cached in memory for performance.
   * @type {Record<string, string|number|boolean>}
   */
  let namespaceValues = Object.create(null);

  const readFromStorage = async () => {
    namespaceValues = Object.create(null);

    try {
      const data = await idbGet(getStorageKey());
      if (data && data.data) {
        for (const [key, value] of Object.entries(data.data)) {
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            namespaceValues[key] = value;
          }
        }
      }
    } catch (error) {
      console.error("Error reading from IndexedDB", error);
    }
  };

  const saveToStorage = async () => {
    try {
      if (Object.keys(namespaceValues).length > 0) {
        await idbSet(getStorageKey(), {
          time: Math.round(Date.now() / 1000),
          data: namespaceValues,
        });
      } else {
        await idbRemove(getStorageKey());
      }

      // Notify other tabs since IndexedDB doesn't natively trigger cross-tab storage events
      if (typeof BroadcastChannel !== "undefined") {
        syncChannel.postMessage({ type: "sync", key: getStorageKey() });
      }
    } catch (error) {
      console.error("Error saving to IndexedDB", error);
    }
  };

  // Cross-window sync handler using BroadcastChannel
  let syncChannel;
  if (typeof BroadcastChannel !== "undefined") {
    syncChannel = new BroadcastChannel("turbowarp_indexeddb_sync");
    syncChannel.onmessage = (event) => {
      if (getNamespace() && event.data.type === "sync" && event.data.key === getStorageKey()) {
        readFromStorage().then(() => {
          Scratch.vm.runtime.startHats("indexeddb_whenChanged");
        });
      }
    };
  }

  const generateRandomNamespace = () => {
    const soup = "0123456789abcdef";
    let id = "";
    for (let i = 0; i < 16; i++) {
      id += soup[Math.floor(Math.random() * soup.length)];
    }
    return id;
  };

  const prepareInitialNamespace = () => {
    if (getNamespace()) {
      syncPromise = readFromStorage();
    } else {
      setNamespace(generateRandomNamespace());
    }
  };

  Scratch.vm.runtime.on("PROJECT_LOADED", () => {
    prepareInitialNamespace();
  });

  Scratch.vm.runtime.on("RUNTIME_DISPOSED", () => {
    namespaceValues = Object.create(null);
  });

  prepareInitialNamespace();

  let lastNamespaceWarning = 0;
  const validNamespace = () => {
    const valid = !!getNamespace();
    if (!valid && Date.now() - lastNamespaceWarning > 3000) {
      alert(
        Scratch.translate(
          'IndexedDB extension: project must run the "set storage namespace ID" block before it can use other blocks'
        )
      );
      lastNamespaceWarning = Date.now();
    }
    return valid;
  };

  class IndexedDBExtension {
    getInfo() {
      return {
        id: "indexeddb",
        name: Scratch.translate("IndexedDB"),
        color1: "#935cd6",
        blocks: [
          {
            blockType: Scratch.BlockType.LABEL,
            text: getNamespace()
              ? Scratch.translate(
                  {
                    default: "Namespace: {namespace}",
                  },
                  {
                    namespace: getNamespace(),
                  }
                )
              : Scratch.translate("No namespace set"),
          },
          {
            opcode: "get",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("get [KEY] from storage"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: Scratch.translate("score"),
              },
            },
          },
          {
            opcode: "set",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [KEY] to [VALUE] in storage"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: Scratch.translate("score"),
              },
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "1000",
              },
            },
          },
          {
            opcode: "remove",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("delete [KEY] from storage"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: Scratch.translate("score"),
              },
            },
          },
          {
            opcode: "removeAll",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("delete storage"),
          },
          {
            opcode: "whenChanged",
            blockType: Scratch.BlockType.EVENT,
            text: Scratch.translate("when another window changes storage"),
            isEdgeActivated: false,
          },
          "---",
          {
            opcode: "setProjectId",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set namespace to [ID]"),
            arguments: {
              ID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: getNamespace() || Scratch.translate("project title"),
              },
            },
          },
        ],
      };
    }

    async setProjectId({ ID }) {
      setNamespace(Scratch.Cast.toString(ID));
      await syncPromise;
    }

    async get({ KEY }) {
      if (!validNamespace()) {
        return "";
      }
      await syncPromise;
      KEY = Scratch.Cast.toString(KEY);
      if (!Object.prototype.hasOwnProperty.call(namespaceValues, KEY)) {
        return "";
      }
      return namespaceValues[KEY];
    }

    async set({ KEY, VALUE }) {
      if (!validNamespace()) {
        return "";
      }
      await syncPromise;
      namespaceValues[Scratch.Cast.toString(KEY)] = VALUE;
      await saveToStorage();
    }

    async remove({ KEY }) {
      if (!validNamespace()) {
        return "";
      }
      await syncPromise;
      delete namespaceValues[Scratch.Cast.toString(KEY)];
      await saveToStorage();
    }

    async removeAll() {
      if (!validNamespace()) {
        return "";
      }
      await syncPromise;
      namespaceValues = Object.create(null);
      await saveToStorage();
    }
  }

  Scratch.extensions.register(new IndexedDBExtension());
})(Scratch);
