// Name: IndexedDB
// ID: bfIndexedDB
// Description: Store data persistently using IndexedDB. Like cookies, but better.
// By: Boswell Fox <https://github.com/boswellfox>
// Original: KaneCoded <https://github.com/kanecoded>
// Original: infernostars
// Original: GarboMuffin
// License: LGPL-3.0-only

// Version: 0.1.0
// Created: 7/28/2026

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("IndexedDB must be run unsandboxed");
  }

  const DB_NAME = "TurboWarp_ExtensionStorage";
  const STORE_NAME = "bfIndexedDB";
  let dbPromise = null;

  const initDB = () => {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
          e.target.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => {
          dbPromise = null;
          reject(e.target.error);
        };
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

  const getGlobalNamespace = () => Scratch.vm.runtime.extensionStorage["bfIndexedDB"]?.namespace;

  /**
   * @param {string} newNamespace
   */
  const setGlobalNamespace = (newNamespace) => {
    Scratch.vm.runtime.extensionStorage["bfIndexedDB"] = {
      namespace: newNamespace,
    };

    if (Scratch.vm.extensionManager.isExtensionLoaded("bfIndexedDB")) {
      Scratch.vm.extensionManager.refreshBlocks("bfIndexedDB");
    }
  };

  const STORAGE_PREFIX = "extensions.turbowarp.org/bfIndexedDB:";
  const getStorageKey = (ns) => `${STORAGE_PREFIX}${ns}`;

  /**
   * @type {Map<string, Record<string, string|number|boolean>>}
   */
  const namespaceValues = new Map();

  /**
   * @type {Map<string, Promise<void>>}
   */
  const syncPromises = new Map();

  const getNamespaceForTarget = (target) => {
    if (target && target.__bfIndexedDBNamespace) {
      return target.__bfIndexedDBNamespace;
    }
    return getGlobalNamespace();
  };

  /**
   * @param {string} ns
   * @returns {Record<string, string|number|boolean>}
   */
  const getValuesForNamespace = (ns) => {
    if (!namespaceValues.has(ns)) {
      namespaceValues.set(ns, Object.create(null));
    }
    return namespaceValues.get(ns);
  };

  const readFromStorage = async (ns) => {
    const values = Object.create(null);
    try {
      const data = await idbGet(getStorageKey(ns));
      if (data && data.data) {
        for (const [key, value] of Object.entries(data.data)) {
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            values[key] = value;
          }
        }
      }
    } catch (error) {
      console.error("Error reading from IndexedDB", error);
    }
    namespaceValues.set(ns, values);
  };

  const saveToStorage = async (ns) => {
    try {
      const values = getValuesForNamespace(ns);
      if (Object.keys(values).length > 0) {
        await idbSet(getStorageKey(ns), {
          time: Math.round(Date.now() / 1000),
          data: values,
        });
      } else {
        await idbRemove(getStorageKey(ns));
      }

      if (typeof BroadcastChannel !== "undefined") {
        syncChannel.postMessage({ type: "sync", key: getStorageKey(ns) });
      }
    } catch (error) {
      console.error("Error saving to IndexedDB", error);
    }
  };

  /**
   * @param {string} ns
   */
  const loadNamespace = (ns) => {
    syncPromises.set(ns, readFromStorage(ns));
  };

  // Cross-window sync handler using BroadcastChannel
  let syncChannel;
  if (typeof BroadcastChannel !== "undefined") {
    syncChannel = new BroadcastChannel("turbowarp_bfIndexedDB_sync");
    syncChannel.onmessage = (event) => {
      if (event.data.type === "sync") {
        const ns = event.data.key.slice(STORAGE_PREFIX.length);
        if (ns) {
          syncPromises.set(
            ns,
            readFromStorage(ns).then(() => {
              Scratch.vm.runtime.startHats("bfIndexedDB_whenChanged");
            })
          );
        }
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
    if (getGlobalNamespace()) {
      loadNamespace(getGlobalNamespace());
    } else {
      setGlobalNamespace(generateRandomNamespace());
      loadNamespace(getGlobalNamespace());
    }
  };

  Scratch.vm.runtime.on("PROJECT_LOADED", () => {
    prepareInitialNamespace();
  });

  Scratch.vm.runtime.on("RUNTIME_DISPOSED", () => {
    namespaceValues.clear();
  });

  prepareInitialNamespace();

  let lastNamespaceWarning = 0;
  const validNamespace = (target) => {
    const ns = getNamespaceForTarget(target);
    const valid = !!ns;
    if (!valid && Date.now() - lastNamespaceWarning > 3000) {
      alert(
        Scratch.translate(
          'IndexedDB extension: project must run the "set namespace to [ID] [locally/globally]" block before it can use other blocks'
        )
      );
      lastNamespaceWarning = Date.now();
    }
    return valid;
  };

  class IndexedDBExtension {
    getInfo() {
      return {
        id: "bfIndexedDB",
        name: Scratch.translate("IndexedDB"),
        color1: "#5cb1d6",
        blocks: [
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
            opcode: "setNamespace",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set namespace to [ID] [SCOPE]"),
            arguments: {
              ID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: getGlobalNamespace() || Scratch.translate("project title"),
              },
              SCOPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "namespaceScope",
              },
            },
          },
          {
            opcode: "getNamespace",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("my namespace"),
          },
        ],
        menus: {
          namespaceScope: {
            items: [
              {
                text: Scratch.translate("locally"),
                value: "locally",
              },
              {
                text: Scratch.translate("globally"),
                value: "globally",
              },
            ],
          },
        },
      };
    }

    setNamespace({ ID, SCOPE }, util) {
      const ns = Scratch.Cast.toString(ID);
      if (SCOPE === "locally") {
        util.target.__bfIndexedDBNamespace = ns;
      } else {
        for (const target of Scratch.vm.runtime.targets) {
          target.__bfIndexedDBNamespace = ns;
        }
      }
      if (!syncPromises.has(ns)) {
        loadNamespace(ns);
      }
      Scratch.vm.extensionManager.refreshBlocks("bfIndexedDB");
    }

    getNamespace(args, util) {
      return getNamespaceForTarget(util.target) || "";
    }

    async get({ KEY }, util) {
      if (!validNamespace(util.target)) {
        return "";
      }
      const ns = getNamespaceForTarget(util.target);
      const promise = syncPromises.get(ns);
      if (promise) await promise;
      KEY = Scratch.Cast.toString(KEY);
      const values = getValuesForNamespace(ns);
      if (!Object.prototype.hasOwnProperty.call(values, KEY)) {
        return "";
      }
      return values[KEY];
    }

    async set({ KEY, VALUE }, util) {
      if (!validNamespace(util.target)) {
        return;
      }
      const ns = getNamespaceForTarget(util.target);
      const promise = syncPromises.get(ns);
      if (promise) await promise;

      if (typeof VALUE !== "string" && typeof VALUE !== "number" && typeof VALUE !== "boolean") {
        VALUE = Scratch.Cast.toString(VALUE);
      }

      const values = getValuesForNamespace(ns);
      values[Scratch.Cast.toString(KEY)] = VALUE;
      await saveToStorage(ns);
    }

    async remove({ KEY }, util) {
      if (!validNamespace(util.target)) {
        return;
      }
      const ns = getNamespaceForTarget(util.target);
      const promise = syncPromises.get(ns);
      if (promise) await promise;
      const values = getValuesForNamespace(ns);
      delete values[Scratch.Cast.toString(KEY)];
      await saveToStorage(ns);
    }

    async removeAll(args, util) {
      if (!validNamespace(util.target)) {
        return;
      }
      const ns = getNamespaceForTarget(util.target);
      const promise = syncPromises.get(ns);
      if (promise) await promise;
      namespaceValues.set(ns, Object.create(null));
      await saveToStorage(ns);
    }
  }

  Scratch.extensions.register(new IndexedDBExtension());
})(Scratch);
