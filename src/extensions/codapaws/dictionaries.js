// Name: Dictionaries
// ID: codaDictionaries
// Description: Bring the full power of JSON to your Scratch projects.
// By: Coda <https://github.com/codapaws>
// Original: KaneCoded <https://github.com/kanecoded>
// Original: Vercte <https://scratch.mit.edu/users/lolecksdeehaha/>
// License: LGPL-3.0-only

// Version: 0.1.0
// Created: 7/3/2026

(function (Scratch) {
  "use strict";

  const dictionaries = new Map();

  class DictionariesExtension {
    getInfo() {
      return {
        id: "codaDictionaries",
        name: Scratch.translate("Dictionaries"),
        color1: "#5cd695",
        blocks: [
          {
            opcode: "dictList",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("list of dictionaries"),
          },
          {
            opcode: "dictStringify",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("stringify dictionary [DICT] into JSON"),
            arguments: {
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictGet",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("key [KEY] from dictionary [DICT]"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "bar",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictKeys",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("keys of path [KEY] in dictionary [DICT]"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "items",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictLength",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("length of [KEY] in [DICT]"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "items",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictType",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("type of [KEY] in [DICT]"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "bar",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },

          "---",
          // Advanced Queries
          {
            opcode: "dictContainsValue",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate("is value [VAL] mentioned anywhere in [DICT]?"),
            arguments: {
              VAL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "search_term",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictFindPath",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("path to first [VAL] in [DICT]"),
            arguments: {
              VAL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "search_term",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictFilterArray",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("filter array [KEY] in [DICT] where [SUBKEY] [OP] [VAL]"),
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "users" },
              DICT: { type: Scratch.ArgumentType.STRING, defaultValue: "foo" },
              SUBKEY: { type: Scratch.ArgumentType.STRING, defaultValue: "id" },
              OP: { type: Scratch.ArgumentType.STRING, menu: "filter_ops" },
              VAL: { type: Scratch.ArgumentType.STRING, defaultValue: "1" },
            },
          },
          {
            opcode: "dictAggregate",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("get [OP] of [KEY] in [DICT]"),
            arguments: {
              OP: { type: Scratch.ArgumentType.STRING, menu: "agg_ops" },
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "scores",
              },
              DICT: { type: Scratch.ArgumentType.STRING, defaultValue: "foo" },
            },
          },
          {
            opcode: "dictFlatten",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("flatten dictionary [DICT] to JSON"),
            arguments: {
              DICT: { type: Scratch.ArgumentType.STRING, defaultValue: "foo" },
            },
          },

          "---",

          {
            opcode: "dictCheckProp",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate("key [KEY] in [DICT] [CHECK]?"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "bar",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
              CHECK: {
                type: Scratch.ArgumentType.STRING,
                menu: "check_menu",
              },
            },
          },

          "---",

          {
            opcode: "dictManageKey",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("key [KEY] in [DICT]: [ACTION] [VAL]"),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "bar",
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "key_action_menu",
              },
              VAL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "baz",
              },
            },
          },
          {
            opcode: "dictManage",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("dictionary [DICT]: [ACTION] [DATA]"),
            arguments: {
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "dict_action_menu",
              },
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{"bar": "baz"}',
              },
            },
          },
          {
            opcode: "dictClone",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("clone dictionary [SRC] as [DEST]"),
            arguments: {
              SRC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "original",
              },
              DEST: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "copy",
              },
            },
          },
          {
            opcode: "dictMerge",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("merge dictionary [SRC] into [DEST]"),
            arguments: {
              SRC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "data",
              },
              DEST: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "foo",
              },
            },
          },
          {
            opcode: "dictExportBase64",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("export dictionary [DICT] as Base64"),
            arguments: {
              DICT: { type: Scratch.ArgumentType.STRING, defaultValue: "foo" },
            },
          },

          "---",
          // Array Operations
          {
            opcode: "arrayInit",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("initialize [DICT] as empty array"),
            arguments: {
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "arrayPush",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("push [VAL] to array [KEY] in [DICT]"),
            arguments: {
              VAL: { type: Scratch.ArgumentType.STRING, defaultValue: "item" },
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "arrayGetItem",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("item [INDEX] of array [KEY] in [DICT]"),
            arguments: {
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "arraySetItem",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("replace item [INDEX] of array [KEY] in [DICT] with [VAL]"),
            arguments: {
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VAL: { type: Scratch.ArgumentType.STRING, defaultValue: "item" },
            },
          },
          {
            opcode: "arrayInsertItem",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("insert [VAL] at [INDEX] in array [KEY] in [DICT]"),
            arguments: {
              VAL: { type: Scratch.ArgumentType.STRING, defaultValue: "item" },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "arrayRemoveItem",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("delete item [INDEX] from array [KEY] in [DICT]"),
            arguments: {
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "arrayJoin",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("items of array [KEY] in [DICT] joined by [SEP]"),
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: "" },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              SEP: { type: Scratch.ArgumentType.STRING, defaultValue: ", " },
            },
          },
        ],
        menus: {
          check_menu: {
            acceptReporters: true,
            items: ["is defined", "is null", "is array", "is dictionary (object)"],
          },
          key_action_menu: {
            acceptReporters: true,
            items: ["set to", "change by", "push", "delete"],
          },
          dict_action_menu: {
            acceptReporters: true,
            items: ["load JSON", "clear", "delete"],
          },
          filter_ops: {
            acceptReporters: true,
            items: ["=", "!=", ">", "<", "contains"],
          },
          agg_ops: {
            acceptReporters: true,
            items: ["sum", "average", "min", "max"],
          },
        },
      };
    }

    isDangerousKey(key) {
      return key === "__proto__" || key === "constructor" || key === "prototype";
    }

    sanitize(obj) {
      if (!obj || typeof obj !== "object") return obj;

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          obj[i] = this.sanitize(obj[i]);
        }
        return obj;
      }

      for (const key of Object.keys(obj)) {
        if (this.isDangerousKey(key)) {
          delete obj[key];
        } else {
          obj[key] = this.sanitize(obj[key]);
        }
      }
      return obj;
    }

    isPlainObject(val) {
      return !!val && typeof val === "object" && !Array.isArray(val);
    }

    tryParse(val) {
      if (typeof val !== "string") return val;
      const v = val.trim();
      if ((v.startsWith("{") && v.endsWith("}")) || (v.startsWith("[") && v.endsWith("]"))) {
        try {
          return this.sanitize(JSON.parse(v));
        } catch (_e) {
          return val;
        }
      }
      return val;
    }

    parseArrayIndex(part) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 1) return null;
      return index - 1;
    }

    resolvePath(root, pathString, autoCreate = false) {
      if (!pathString || pathString === "") {
        return {
          target: root,
          key: null,
        };
      }

      const placeholder = "\uFFFF";
      const protectedPath = pathString.replace(/\\\./g, placeholder);
      const parts = protectedPath.split(".").map((p) => p.split(placeholder).join("."));

      let current = root;

      for (let i = 0; i < parts.length - 1; i++) {
        let part = parts[i];

        // Ensure valid 1-based indexing if traversing an array
        if (Array.isArray(current)) {
          const index = this.parseArrayIndex(part);
          if (index === null) return null;
          part = index;
        }

        if (this.isDangerousKey(String(part))) {
          return null;
        }

        if (typeof current !== "object" || current === null) {
          return null;
        }

        if (current[part] === undefined) {
          if (autoCreate) {
            const nextPart = parts[i + 1];
            current[part] = isNaN(Number(nextPart)) ? {} : [];
          } else {
            return null;
          }
        }

        current = current[part];
      }

      if (typeof current !== "object" || current === null) return null;

      let finalKey = parts[parts.length - 1];

      // Ensure valid 1-based indexing for the final key target if it's an array
      if (Array.isArray(current)) {
        const index = this.parseArrayIndex(finalKey);
        if (index === null) return null;
        finalKey = index;
      }

      if (this.isDangerousKey(String(finalKey))) {
        return null;
      }

      return {
        target: current,
        key: finalKey,
      };
    }

    deepMerge(target, source) {
      for (const key of Object.keys(source)) {
        if (this.isDangerousKey(key)) continue;

        if (this.isPlainObject(source[key]) && this.isPlainObject(target[key])) {
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] =
            typeof source[key] === "object" && source[key] !== null
              ? this.cloneValue(source[key])
              : source[key];
        }
      }
      return target;
    }

    formatOutput(value) {
      if (value === undefined) return "undefined";
      if (value === null) return "null";
      if (typeof value === "object") return JSON.stringify(value);
      return value;
    }

    deepContains(obj, target) {
      if (typeof obj === "object" && obj !== null) {
        return Object.values(obj).some((val) => this.deepContains(val, target));
      }
      return String(obj) === String(target);
    }

    formatPathSegment(segment) {
      return String(segment).replace(/\./g, "\\.");
    }

    deepFindPath(obj, target, currentPath = "") {
      if (typeof obj !== "object" || obj === null) {
        if (String(obj) === String(target)) return currentPath;
      } else {
        const isArray = Array.isArray(obj);
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (this.isDangerousKey(key)) continue;

            // Shift up the path output so it represents 1-based array indexes
            const displayKey = isArray && !isNaN(Number(key)) ? Math.trunc(Number(key)) + 1 : key;
            const pathKey = this.formatPathSegment(displayKey);
            const newPath = currentPath ? `${currentPath}.${pathKey}` : pathKey;
            const found = this.deepFindPath(obj[key], target, newPath);
            if (found !== "") return found;
          }
        }
      }
      return "";
    }

    flattenObject(obj, prefix = "", res = {}) {
      const isArray = Array.isArray(obj);
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (this.isDangerousKey(key)) continue;

          // Shift keys to 1-based format in flatten
          const displayKey = isArray && !isNaN(Number(key)) ? Math.trunc(Number(key)) + 1 : key;
          const val = obj[key];
          const pathKey = this.formatPathSegment(displayKey);
          const newKey = prefix ? `${prefix}.${pathKey}` : pathKey;
          if (typeof val === "object" && val !== null) {
            this.flattenObject(val, newKey, res);
          } else {
            res[newKey] = val;
          }
        }
      }
      return res;
    }

    getArrayForKey(dictionaries, DICT, KEY) {
      if (!dictionaries.has(DICT)) return null;
      const root = dictionaries.get(DICT);
      if (KEY === "") {
        return Array.isArray(root) ? root : null;
      }
      const loc = this.resolvePath(root, KEY);
      if (!loc || !Array.isArray(loc.target[loc.key])) return null;
      return loc.target[loc.key];
    }

    cloneValue(value) {
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }
      return JSON.parse(JSON.stringify(value));
    }

    dictList() {
      return JSON.stringify(Array.from(dictionaries.keys()));
    }

    dictStringify({ DICT }) {
      if (!dictionaries.has(DICT)) return "{}";
      return JSON.stringify(dictionaries.get(DICT));
    }

    dictGet({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return "undefined";
      const root = dictionaries.get(DICT);

      if (KEY === "") return this.formatOutput(root);

      const loc = this.resolvePath(root, KEY);
      if (!loc || loc.target === null || loc.target[loc.key] === undefined) {
        return "undefined";
      }

      return this.formatOutput(loc.target[loc.key]);
    }

    dictKeys({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return "[]";
      const root = dictionaries.get(DICT);

      if (!KEY) {
        if (typeof root === "object" && root !== null) {
          const keys = Object.keys(root);
          return Array.isArray(root)
            ? JSON.stringify(keys.map((k) => Number(k) + 1))
            : JSON.stringify(keys);
        }
        return "[]";
      }

      const loc = this.resolvePath(root, KEY);
      if (!loc || loc.target === null || loc.target[loc.key] === undefined) {
        return "[]";
      }

      const val = loc.target[loc.key];
      if (typeof val === "object" && val !== null) {
        const keys = Object.keys(val);
        return Array.isArray(val)
          ? JSON.stringify(keys.map((k) => Number(k) + 1))
          : JSON.stringify(keys);
      }
      return "[]";
    }

    dictLength({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return 0;
      const root = dictionaries.get(DICT);

      if (!KEY) {
        if (Array.isArray(root)) return root.length;
        if (typeof root === "object" && root !== null) return Object.keys(root).length;
        return 0;
      }

      const loc = this.resolvePath(root, KEY);
      if (!loc || loc.target === null || loc.target[loc.key] === undefined) return 0;

      const val = loc.target[loc.key];
      if (Array.isArray(val)) return val.length;
      if (typeof val === "string") return val.length;
      if (typeof val === "object" && val !== null) return Object.keys(val).length;
      return 0;
    }

    dictType({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return "undefined";
      const root = dictionaries.get(DICT);

      if (KEY === "") {
        if (root === null) return "null";

        if (Array.isArray(root)) return "array";
        return typeof root;
      }

      const loc = this.resolvePath(root, KEY);

      if (!loc || loc.target === null || loc.target[loc.key] === undefined) {
        return "undefined";
      }

      const val = loc.target[loc.key];
      if (val === null) return "null";
      if (Array.isArray(val)) return "array";
      return typeof val;
    }

    dictContainsValue({ VAL, DICT }) {
      if (!dictionaries.has(DICT)) return false;
      const root = dictionaries.get(DICT);
      return this.deepContains(root, VAL);
    }

    dictFindPath({ VAL, DICT }) {
      if (!dictionaries.has(DICT)) return "";
      const root = dictionaries.get(DICT);
      return this.deepFindPath(root, VAL);
    }

    dictFlatten({ DICT }) {
      if (!dictionaries.has(DICT)) return "{}";
      const root = dictionaries.get(DICT);
      if (typeof root !== "object" || root === null) return "{}";
      const flat = this.flattenObject(root);
      return JSON.stringify(flat);
    }

    dictFilterArray({ KEY, DICT, SUBKEY, OP, VAL }) {
      if (!dictionaries.has(DICT)) return "[]";
      const root = dictionaries.get(DICT);

      let arr = root;
      if (KEY !== "") {
        const loc = this.resolvePath(root, KEY);
        if (!loc || !Array.isArray(loc.target[loc.key])) return "[]";
        arr = loc.target[loc.key];
      }

      if (!Array.isArray(arr)) return "[]";

      const res = arr.filter((item) => {
        if (typeof item !== "object" || item === null) return false;

        const loc = this.resolvePath(item, SUBKEY);
        if (!loc || loc.target[loc.key] === undefined) return false;

        const prop = loc.target[loc.key];
        const compareVal = this.tryParse(VAL);

        if (OP === "=") return String(prop) === String(compareVal);
        if (OP === "!=") return String(prop) !== String(compareVal);
        if (OP === ">") return Number(prop) > Number(compareVal);
        if (OP === "<") return Number(prop) < Number(compareVal);
        if (OP === "contains") return String(prop).includes(String(compareVal));
        return false;
      });

      return JSON.stringify(res);
    }

    dictAggregate({ OP, KEY, DICT }) {
      if (!dictionaries.has(DICT)) return 0;
      const root = dictionaries.get(DICT);

      let arr = root;
      if (KEY !== "") {
        const loc = this.resolvePath(root, KEY);
        if (!loc) return 0;
        arr = loc.target[loc.key];
      }

      if (!Array.isArray(arr)) return 0;
      const nums = arr
        .map((value) => {
          if (typeof value === "number") return value;
          if (typeof value === "string" && value.trim() !== "") {
            return Number(value);
          }
          return NaN;
        })
        .filter(Number.isFinite);
      if (nums.length === 0) return 0;

      if (OP === "sum") return nums.reduce((a, b) => a + b, 0);
      if (OP === "average") return nums.reduce((a, b) => a + b, 0) / nums.length;
      if (OP === "min") return nums.reduce((a, b) => Math.min(a, b), nums[0]);
      if (OP === "max") return nums.reduce((a, b) => Math.max(a, b), nums[0]);
      return 0;
    }

    dictExportBase64({ DICT }) {
      if (!dictionaries.has(DICT)) return "";
      const str = JSON.stringify(dictionaries.get(DICT));
      try {
        return btoa(str);
      } catch (_e) {
        return btoa(
          encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
            String.fromCharCode(parseInt(p1, 16))
          )
        );
      }
    }

    dictCheckProp({ KEY, DICT, CHECK }) {
      if (!dictionaries.has(DICT)) return false;
      const root = dictionaries.get(DICT);

      if (KEY === "") {
        if (CHECK === "is defined") return true;
        if (CHECK === "is null") return root === null;

        if (CHECK === "is array") return Array.isArray(root);
        if (CHECK === "is dictionary (object)") return this.isPlainObject(root);
        return false;
      }

      const loc = this.resolvePath(root, KEY);

      if (!loc || loc.target === null) return false;
      const val = loc.target[loc.key];

      if (CHECK === "is defined") return Object.prototype.hasOwnProperty.call(loc.target, loc.key);
      if (CHECK === "is null") return val === null;
      if (CHECK === "is array") return Array.isArray(val);
      if (CHECK === "is dictionary (object)") return this.isPlainObject(val);
      return false;
    }

    dictManageKey({ KEY, DICT, ACTION, VAL }) {
      if (!dictionaries.has(DICT)) {
        if (ACTION === "delete") return;
        dictionaries.set(DICT, KEY === "" && ACTION === "push" ? [] : {});
      }
      const root = dictionaries.get(DICT);

      if (KEY === "") {
        if (ACTION === "set to") {
          const newVal = this.tryParse(VAL);

          if (typeof newVal === "object" && newVal !== null) {
            dictionaries.set(DICT, newVal);
          }
        } else if (ACTION === "delete") {
          dictionaries.delete(DICT);
        } else if (ACTION === "push") {
          if (Array.isArray(root)) {
            root.push(this.tryParse(VAL));
          }
        }
        return;
      }

      const autoCreate = ACTION !== "delete";
      const loc = this.resolvePath(root, KEY, autoCreate);

      if (!loc) return;

      if (ACTION === "set to") {
        loc.target[loc.key] = this.tryParse(VAL);
      } else if (ACTION === "change by") {
        const currentVal = loc.target[loc.key];

        if (typeof currentVal === "object" && currentVal !== null) return;

        const startVal = Number(currentVal);
        const delta = Number(VAL);

        const safeStart = isNaN(startVal) ? 0 : startVal;
        const safeDelta = isNaN(delta) ? 0 : delta;

        loc.target[loc.key] = safeStart + safeDelta;
      } else if (ACTION === "push") {
        let targetVal = loc.target[loc.key];

        if (targetVal !== undefined && !Array.isArray(targetVal)) {
          if (typeof targetVal === "object" && targetVal !== null) return;
          targetVal = [targetVal];
          loc.target[loc.key] = targetVal;
        }

        if (targetVal === undefined) {
          loc.target[loc.key] = [];
          targetVal = loc.target[loc.key];
        }
        targetVal.push(this.tryParse(VAL));
      } else if (ACTION === "delete") {
        if (Array.isArray(loc.target)) {
          // Since resolvePath handles the 1-based shift, loc.key is already a 0-based index here
          const index = Math.trunc(Number(loc.key));
          if (!isNaN(index) && index >= 0 && index < loc.target.length) {
            loc.target.splice(index, 1);
          }
        } else {
          delete loc.target[loc.key];
        }
      }
    }

    dictManage({ DICT, ACTION, DATA }) {
      if (ACTION === "delete") {
        if (dictionaries.has(DICT)) dictionaries.delete(DICT);
      } else if (ACTION === "clear") {
        if (dictionaries.has(DICT)) {
          const current = dictionaries.get(DICT);
          dictionaries.set(DICT, Array.isArray(current) ? [] : {});
        }
      } else if (ACTION === "load JSON") {
        let parsed;
        try {
          parsed = this.sanitize(JSON.parse(DATA));
        } catch (_e) {
          parsed = {
            error: "Invalid JSON",
          };
        }

        if (typeof parsed !== "object" || parsed === null) {
          parsed = {
            error: "Invalid JSON Structure",
          };
        }

        dictionaries.set(DICT, parsed);
      }
    }

    dictClone({ SRC, DEST }) {
      if (!dictionaries.has(SRC)) return;
      const src = dictionaries.get(SRC);

      try {
        dictionaries.set(DEST, this.cloneValue(src));
      } catch (e) {
        console.warn("Dictionaries Pro: Clone failed", e);
      }
    }

    dictMerge({ SRC, DEST }) {
      if (!dictionaries.has(SRC)) return;
      const srcData = dictionaries.get(SRC);

      if (!dictionaries.has(DEST)) {
        try {
          dictionaries.set(DEST, this.cloneValue(srcData));
        } catch (e) {
          console.warn("Dictionaries Pro: Merge (clone) failed", e);
        }
        return;
      }

      const destData = dictionaries.get(DEST);

      if (this.isPlainObject(srcData) && this.isPlainObject(destData)) {
        this.deepMerge(destData, srcData);
      } else {
        try {
          dictionaries.set(DEST, this.cloneValue(srcData));
        } catch (e) {
          console.warn("Dictionaries Pro: Merge (overwrite) failed", e);
        }
      }
    }

    arrayInit({ DICT }) {
      dictionaries.set(DICT, []);
    }

    arrayPush({ VAL, KEY, DICT }) {
      if (!dictionaries.has(DICT)) {
        const firstSeg = KEY.split(".")[0];
        dictionaries.set(DICT, KEY === "" || /^\d/.test(firstSeg) ? [] : {});
      }
      const root = dictionaries.get(DICT);

      if (KEY === "") {
        if (Array.isArray(root)) {
          root.push(this.tryParse(VAL));
        }
        return;
      }

      const loc = this.resolvePath(root, KEY, true);
      if (!loc) return;

      let arr = loc.target[loc.key];
      if (arr === undefined) {
        loc.target[loc.key] = [];
        arr = loc.target[loc.key];
      }
      if (Array.isArray(arr)) {
        arr.push(this.tryParse(VAL));
      }
    }

    arrayGetItem({ INDEX, KEY, DICT }) {
      const arr = this.getArrayForKey(dictionaries, DICT, KEY);
      if (arr === null) return "undefined";

      const idx = Math.trunc(Number(INDEX)) - 1; // 1-based conversion
      if (isNaN(idx) || idx < 0 || idx >= arr.length) return "undefined";
      return this.formatOutput(arr[idx]);
    }

    arraySetItem({ INDEX, KEY, DICT, VAL }) {
      const arr = this.getArrayForKey(dictionaries, DICT, KEY);
      if (arr === null) return;

      const idx = Math.trunc(Number(INDEX)) - 1; // 1-based conversion
      if (isNaN(idx) || idx < 0 || idx >= arr.length) return;
      arr[idx] = this.tryParse(VAL);
    }

    arrayInsertItem({ VAL, INDEX, KEY, DICT }) {
      const arr = this.getArrayForKey(dictionaries, DICT, KEY);
      if (arr === null) return;

      const idx = Math.trunc(Number(INDEX)) - 1; // 1-based conversion
      if (isNaN(idx) || idx < 0) return;
      arr.splice(Math.min(idx, arr.length), 0, this.tryParse(VAL));
    }

    arrayRemoveItem({ INDEX, KEY, DICT }) {
      const arr = this.getArrayForKey(dictionaries, DICT, KEY);
      if (arr === null) return;

      const idx = Math.trunc(Number(INDEX)) - 1; // 1-based conversion
      if (isNaN(idx) || idx < 0 || idx >= arr.length) return;
      arr.splice(idx, 1);
    }

    arrayJoin({ KEY, DICT, SEP }) {
      const arr = this.getArrayForKey(dictionaries, DICT, KEY);
      if (arr === null) return "";
      return arr
        .map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
        .join(SEP);
    }
  }

  Scratch.extensions.register(new DictionariesExtension());
})(Scratch);
