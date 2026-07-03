// Name: Signals
// ID: codaSignals
// Description: Bring IPC-like communication to your Scratch projects.
// By: Coda <https://github.com/codapaws>
// Original: KaneCoded <https://github.com/kanecoded>
// License: LGPL-3.0-only

// Version: 0.1.1
// Created: 7/3/2026

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("The Signals extension must be run unsandboxed.");
  }

  // Unified state management to track active action and check signals
  const pendingSignals = new Map();
  const errorRegistry = new Map();
  let signalIdCounter = 0;

  class SignalsExtension {
    constructor() {
      this._currentSignal = null;
      this._errorEvent = null;

      // Monitor threads at the end of every frame execution loop
      Scratch.vm.runtime.on("AFTER_EXECUTE", () => {
        if (pendingSignals.size === 0) return;
        const activeThreads = new Set(Scratch.vm.runtime.threads);
        const now = Date.now();

        for (const [signalId, info] of pendingSignals.entries()) {
          // 1. Check if the signal has timed out
          if (info.expiresAt && now > info.expiresAt) {
            const code = "408";
            const name = errorRegistry.get(code) || "Timeout";
            this._triggerError(signalId, info, code, name);
            continue;
          }

          // 2. Check if threads have naturally finished
          info.threads = info.threads.filter((t) => activeThreads.has(t));

          // If all threads spawned by this specific signal have completed naturally
          if (info.threads.length === 0) {
            // Mark as success on the target
            const status = this._getStatus(info.target);
            status[info.type] = { success: true, code: "", message: "" };

            if (info.type === "check") {
              info.resolve(""); // Check blocks default to an empty string if no explicit return
            } else {
              info.resolve(); // Action blocks simply finish executing
            }
            pendingSignals.delete(signalId);
          }
        }
      });
    }

    _getStatus(target) {
      if (!target.__signallingStatus) {
        target.__signallingStatus = {
          action: { success: true, code: "", message: "" },
          check: { success: true, code: "", message: "" },
        };
      }
      return target.__signallingStatus;
    }

    _getConfig(target) {
      if (!target.__signallingConfig) {
        target.__signallingConfig = {
          "timeout (seconds)": 5,
          "suppress error hats": false,
          "debug logging": false,
        };
      }
      return target.__signallingConfig;
    }

    _stopPendingSignal(pending) {
      if (!pending) return;

      for (const thread of pending.threads) {
        if (thread && typeof thread.stopThisScript === "function") {
          thread.stopThisScript();
        }
      }
    }

    _triggerError(signalId, pending, code, name) {
      this._stopPendingSignal(pending);

      // Update the target's state for the new reporter blocks
      const status = this._getStatus(pending.target);
      status[pending.type] = { success: false, code: code, message: name };
      const config = this._getConfig(pending.target);

      if (config["debug logging"]) {
        console.warn(
          `[codaSignals] Error thrown by '${pending.target.getName()}': [${code}] ${name}`
        );
      }

      // Stop scripts safely and return standard empty values so output is completely silent
      pending.resolve(pending.type === "check" ? "" : undefined);

      // Only trigger global hat blocks if suppression is disabled
      if (!config["suppress error hats"]) {
        this._errorEvent = {
          targetId: pending.target.id,
          senderName: pending.sender,
          header: pending.header,
          content: pending.content,
          code: code,
          message: name,
          type: pending.type,
        };
        Scratch.vm.runtime.startHats("codaSignals_whenActionCheckFails");
        this._errorEvent = null;
      }

      pendingSignals.delete(signalId);
    }

    getInfo() {
      // Calculate the default error code dynamically every time the blocks are refreshed
      const defaultErrorCode =
        errorRegistry.size > 0 ? Array.from(errorRegistry.keys())[0] : "none";

      return {
        id: "codaSignals",
        name: Scratch.translate("Signals"),
        color1: "#d65c97",
        blocks: [
          {
            opcode: "sendAction",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("send action [HEADER] with [CONTENT]"),
            arguments: {
              HEADER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "removeSprite",
              },
              CONTENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "{}",
              },
            },
          },
          {
            opcode: "sendCheck",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("send check [HEADER] with [CONTENT]"),
            arguments: {
              HEADER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "getFile",
              },
              CONTENT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "config.json",
              },
            },
          },
          "---",
          {
            opcode: "whenSignal",
            blockType: Scratch.BlockType.HAT,
            text: Scratch.translate("when signal [HEADER] received"),
            isEdgeActivated: false,
            arguments: {
              HEADER: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "getFile",
              },
            },
          },
          {
            opcode: "whenAnySignal",
            blockType: Scratch.BlockType.HAT,
            text: Scratch.translate("when any signal received"),
            isEdgeActivated: false,
          },
          {
            opcode: "whenActionCheckFails",
            blockType: Scratch.BlockType.HAT,
            text: Scratch.translate("when an [TYPE] fails with code: [CODE]"),
            isEdgeActivated: false,
            arguments: {
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "signalTypes",
                defaultValue: "action",
              },
              CODE: {
                type: Scratch.ArgumentType.STRING,
                menu: "errorCodesAny",
                defaultValue: "any",
              },
            },
          },
          "---",
          {
            opcode: "signalHeader",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("signal header"),
          },
          {
            opcode: "signalContent",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("signal content"),
          },
          {
            opcode: "signalSender",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("signal sender"),
          },
          {
            opcode: "signalError",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("signal error [PROP]"),
            arguments: {
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: "errorProps",
                defaultValue: "code",
              },
            },
          },
          {
            opcode: "errorSender",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("last error sender"),
            hideFromPalette: true,
          },
          "---",
          {
            opcode: "returnSignal",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("return [VALUE]"),
            isTerminal: true,
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "success",
              },
            },
          },
          {
            opcode: "throwError",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("throw error [CODE]"),
            isTerminal: true,
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                menu: "errorCodes",
                defaultValue: defaultErrorCode,
              },
            },
          },
          {
            opcode: "registerError",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("register error code [CODE] as [NAME]"),
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "404",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Not Found",
              },
            },
          },
          "---",
          {
            opcode: "didLastSucceed",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate("did last [TYPE] succeed?"),
            arguments: {
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "signalTypes",
                defaultValue: "action",
              },
            },
          },
          {
            opcode: "lastErrorProp",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("last [TYPE] error [PROP]"),
            arguments: {
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "signalTypes",
                defaultValue: "action",
              },
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: "errorProps",
                defaultValue: "code",
              },
            },
          },
          "---",
          {
            opcode: "setConfig",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set Signals config [PROP] to [VALUE]"),
            arguments: {
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: "configProps",
                defaultValue: "timeout (seconds)",
              },
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "5",
              },
            },
          },
          {
            opcode: "getConfig",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("Signals config [PROP]"),
            arguments: {
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: "configProps",
                defaultValue: "timeout (seconds)",
              },
            },
          },
        ],
        menus: {
          errorCodes: {
            acceptReporters: true,
            items: "_getErrorCodes",
          },
          errorCodesAny: {
            acceptReporters: false,
            items: "_getErrorCodesAny",
          },
          signalTypes: {
            acceptReporters: false,
            items: ["action", "check"],
          },
          errorProps: {
            acceptReporters: false,
            items: ["code", "message"],
          },
          configProps: {
            acceptReporters: false,
            items: ["timeout (seconds)", "suppress error hats", "debug logging"],
          },
        },
      };
    }

    _getErrorCodes() {
      if (errorRegistry.size === 0) {
        return [{ text: "None registered", value: "none" }];
      }
      return Array.from(errorRegistry.entries()).map(([code, name]) => ({
        text: `${code} - ${name}`,
        value: code,
      }));
    }

    _getErrorCodesAny() {
      const anyItem = { text: "any", value: "any" };
      if (errorRegistry.size === 0) {
        return [anyItem];
      }

      const entries = Array.from(errorRegistry.entries());
      const codes = [
        anyItem,
        { text: `${entries[0][0]} - ${entries[0][1]}`, value: entries[0][0] },
      ];

      for (let i = 1; i < entries.length; i++) {
        codes.push({
          text: `${entries[i][0]} - ${entries[i][1]}`,
          value: entries[i][0],
        });
      }

      return codes;
    }

    sendAction(args, util) {
      return new Promise((resolve) => {
        const signalId = ++signalIdCounter;
        const config = this._getConfig(util.target);
        const timeoutSecs = config["timeout (seconds)"];
        const expiresAt = timeoutSecs > 0 ? Date.now() + timeoutSecs * 1000 : null;

        if (config["debug logging"]) {
          console.log(`[codaSignals] '${util.target.getName()}' sent action: '${args.HEADER}'`);
        }

        pendingSignals.set(signalId, {
          type: "action",
          threads: [],
          resolve,
          target: util.target,
          callerThread: util.thread,
          expiresAt: expiresAt,
          header: args.HEADER,
          content: args.CONTENT,
          sender: util.target.getName(),
        });

        this._currentSignal = {
          header: args.HEADER,
          content: args.CONTENT,
          sender: util.target.getName(),
          signalId: signalId,
        };

        const specificThreads = util.startHats("codaSignals_whenSignal", {});
        const anyThreads = util.startHats("codaSignals_whenAnySignal", {});
        const threads = specificThreads.concat(anyThreads);

        this._currentSignal = null;

        if (threads.length === 0) {
          pendingSignals.delete(signalId);
          const status = this._getStatus(util.target);
          status.action = { success: true, code: "", message: "" };
          resolve();
          return;
        }

        pendingSignals.get(signalId).threads = threads;
      });
    }

    sendCheck(args, util) {
      return new Promise((resolve) => {
        const signalId = ++signalIdCounter;
        const config = this._getConfig(util.target);
        const timeoutSecs = config["timeout (seconds)"];
        const expiresAt = timeoutSecs > 0 ? Date.now() + timeoutSecs * 1000 : null;

        if (config["debug logging"]) {
          console.log(`[codaSignals] '${util.target.getName()}' sent check: '${args.HEADER}'`);
        }

        pendingSignals.set(signalId, {
          type: "check",
          threads: [],
          resolve,
          target: util.target,
          callerThread: util.thread,
          expiresAt: expiresAt,
          header: args.HEADER,
          content: args.CONTENT,
          sender: util.target.getName(),
        });

        this._currentSignal = {
          header: args.HEADER,
          content: args.CONTENT,
          sender: util.target.getName(),
          signalId: signalId,
        };

        const specificThreads = util.startHats("codaSignals_whenSignal", {});
        const anyThreads = util.startHats("codaSignals_whenAnySignal", {});
        const threads = specificThreads.concat(anyThreads);

        this._currentSignal = null;

        if (threads.length === 0) {
          pendingSignals.delete(signalId);
          const status = this._getStatus(util.target);
          status.check = { success: true, code: "", message: "" };
          resolve("");
          return;
        }

        pendingSignals.get(signalId).threads = threads;
      });
    }

    whenSignal(args, util) {
      if (!this._currentSignal) return false;
      if (args.HEADER !== this._currentSignal.header) return false;

      util.thread.__signallingContext = {
        header: this._currentSignal.header,
        content: this._currentSignal.content,
        sender: this._currentSignal.sender,
        signalId: this._currentSignal.signalId,
      };

      return true;
    }

    whenAnySignal(args, util) {
      if (!this._currentSignal) return false;

      util.thread.__signallingContext = {
        header: this._currentSignal.header,
        content: this._currentSignal.content,
        sender: this._currentSignal.sender,
        signalId: this._currentSignal.signalId,
      };

      return true;
    }

    whenActionCheckFails(args, util) {
      if (!this._errorEvent) return false;
      // Note: intentionally removed the targetId check here so ANY sprite catches the error
      if (args.TYPE !== this._errorEvent.type) return false;
      if (args.CODE !== "any" && args.CODE !== this._errorEvent.code) return false;

      util.thread.__signallingErrorContext = {
        sender: this._errorEvent.senderName,
        header: this._errorEvent.header,
        content: this._errorEvent.content,
        type: this._errorEvent.type,
        code: this._errorEvent.code,
        message: this._errorEvent.message,
      };

      return true;
    }

    _getSignallingContext(util) {
      return util.thread.__signallingContext || util.thread.__signallingErrorContext;
    }

    signalHeader(args, util) {
      const context = this._getSignallingContext(util);
      return context ? context.header || "" : "";
    }

    signalContent(args, util) {
      const context = this._getSignallingContext(util);
      return context ? context.content || "" : "";
    }

    signalSender(args, util) {
      const context = this._getSignallingContext(util);
      return context ? context.sender || "" : "";
    }

    signalError(args, util) {
      const errorContext = this._getSignallingContext(util);
      if (!errorContext) return "";
      return errorContext[args.PROP] || "";
    }

    errorSender(args, util) {
      return util.thread.__signallingErrorContext
        ? util.thread.__signallingErrorContext.sender
        : "";
    }

    returnSignal(args, util) {
      const ctx = util.thread.__signallingContext;
      if (ctx && ctx.signalId) {
        const pending = pendingSignals.get(ctx.signalId);
        if (pending) {
          this._stopPendingSignal(pending);

          const status = this._getStatus(pending.target);
          status[pending.type] = { success: true, code: "", message: "" };

          pending.resolve(pending.type === "check" ? args.VALUE : undefined);
          pendingSignals.delete(ctx.signalId);
        }
      }
    }

    registerError(args) {
      const code = String(args.CODE);
      const name = String(args.NAME);
      errorRegistry.set(code, name);

      if (Scratch.vm.extensionManager && Scratch.vm.extensionManager.refreshBlocks) {
        Scratch.vm.extensionManager.refreshBlocks();
      }
    }

    throwError(args, util) {
      const ctx = util.thread.__signallingContext;
      if (ctx && ctx.signalId) {
        const pending = pendingSignals.get(ctx.signalId);
        if (pending) {
          const code = String(args.CODE);
          const name = errorRegistry.get(code) || "Unknown Error";
          this._triggerError(ctx.signalId, pending, code, name);
        }
      }
    }

    didLastSucceed(args, util) {
      const type = args.TYPE;
      const status = this._getStatus(util.target);
      return status[type].success;
    }

    lastErrorProp(args, util) {
      const type = args.TYPE;
      const prop = args.PROP;
      const errorContext = util.thread.__signallingErrorContext;
      if (errorContext && errorContext.type === type) {
        return errorContext[prop] || "";
      }
      const status = this._getStatus(util.target);
      return status[type][prop] || "";
    }

    setConfig(args, util) {
      const prop = args.PROP;
      const val = String(args.VALUE);
      const config = this._getConfig(util.target);

      if (prop === "timeout (seconds)") {
        const timeout = Number(val);
        if (Number.isFinite(timeout) && timeout >= 0) {
          config[prop] = timeout;
        }
      } else if (prop === "suppress error hats" || prop === "debug logging") {
        config[prop] = val.toLowerCase() === "true";
      }
    }

    getConfig(args, util) {
      const config = this._getConfig(util.target);
      // Cast booleans to standard Scratch string representation if needed
      return config[args.PROP];
    }
  }

  Scratch.extensions.register(new SignalsExtension());
})(Scratch);
