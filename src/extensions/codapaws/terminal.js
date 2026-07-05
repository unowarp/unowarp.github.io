// Name: Terminal
// ID: codaTerminal
// Description: Give your Scratch projects a terminal interface.
// By: Coda <https://github.com/codapaws>
// Original: KaneCoded <https://github.com/kanecoded>
// License: LGPL-3.0-only

// Version: 0.2.0
// Created: 7/3/2026

(function (Scratch) {
  "use strict";

  class TerminalExtension {
    constructor() {
      this.visible = false;

      this.padding = 4;
      this.fontSize = 12;
      this.lineHeight = 16;
      this.charWidth = 0;
      this.opacity = 0.75;

      this.logicalWidth = 480;
      this.logicalHeight = 360;

      this.startTime = Date.now();
      this.history = [];
      this.visualLines = [];
      this.historyLimit = 1000;
      this.scrollOffset = 0;

      this.verboseEnabled = false;
      this.activeLoaders = [];
      this.lastAnimFrame = 0;
      this.animFrames = ["[=  ]", "[== ]", "[ ==]", "[  =]", "[   ]"];

      this.typeStyles = {
        info: { tag: "( i )", color: "#00FFFF" },
        hint: { tag: "[ i ]", color: "#55FF55" },
        warning: { tag: "{ ! }", color: "#FFFF55" },
        error: { tag: "{ + }", color: "#FF5555" },
        complete: { tag: "{ X }", color: "#00FF00" },
        verbose: { tag: "{ ~ }", color: "#AAAAAA" },
        loading: {
          tag: "" /* placeholder, since there's loading log animations */,
          color: "#FF55FF",
        },
      };

      this.isAsking = false;
      this.isPassword = false;
      this.focused = false;
      this.currentInput = "";
      this.promptSegments = [];
      this.rawPrompt = "";
      this.resolveAsk = null;

      this.setupRuntimeHooks();
      this.setupCanvas();
      this.setupInputHandlers();
      this.startRenderLoop();
    }

    getInfo() {
      return {
        id: "codaTerminal",
        name: Scratch.translate("Terminal"),
        color1: "#9e95d5",
        blocks: [
          {
            opcode: "manageTerminal",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("[ACTION] terminal"),
            arguments: {
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "terminalActionsMenu",
                defaultValue: "show",
              },
            },
          },
          {
            opcode: "setOpacity",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set terminal opacity to [OPACITY] %"),
            arguments: {
              OPACITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 85 },
            },
          },
          {
            opcode: "setverbose",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set verbose logging [STATE]"),
            arguments: {
              STATE: {
                type: Scratch.ArgumentType.STRING,
                menu: "onOffMenu",
                defaultValue: "on",
              },
            },
          },
          {
            opcode: "logMessage",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("log [MESSAGE] as [TYPE]"),
            arguments: {
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "System operational.",
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "logTypesMenu",
                defaultValue: "info",
              },
            },
          },
          {
            opcode: "replaceLastLine",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("replace last log message with [MESSAGE]"),
            arguments: {
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Replacement text",
              },
            },
          },
          {
            opcode: "closeLoadingGroup",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("close loading group as [STATE]"),
            arguments: {
              STATE: {
                type: Scratch.ArgumentType.STRING,
                menu: "loadingStatesMenu",
                defaultValue: "completed",
              },
            },
          },
          {
            opcode: "askPrompt",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("ask [PROMPT] as [TYPE] and wait"),
            arguments: {
              PROMPT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "@c #FFFF00:root@tw:~$ @c",
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "askTypesMenu",
                defaultValue: "text",
              },
            },
          },
          {
            opcode: "getHistory",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("terminal history"),
          },
          "---",
          {
            opcode: "replaceSpecificLine",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("replace line [LINE] with [MESSAGE]"),
            arguments: {
              LINE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Updated log entry",
              },
            },
          },
          {
            opcode: "centerText",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("center text [TEXT]"),
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "MAIN MENU",
              },
            },
          },
          {
            opcode: "alignRight",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("align right [TEXT]"),
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "v1.0",
              },
            },
          },
          {
            opcode: "createProgressBar",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("progress bar: val [VAL] / max [MAX] length [LEN]"),
            arguments: {
              VAL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              MAX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
              LEN: { type: Scratch.ArgumentType.NUMBER, defaultValue: 20 },
            },
          },
          {
            opcode: "createDivider",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("divider with character [CHAR]"),
            arguments: {
              CHAR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "-",
              },
            },
          },
          {
            opcode: "formatTextBuilder",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("format [TEXT] color [COLOR] bold [BOLD] italic [ITALIC]"),
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "Alert" },
              COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: "#FF5555" },
              BOLD: { type: Scratch.ArgumentType.STRING, menu: "onOffMenu", defaultValue: "on" },
              ITALIC: { type: Scratch.ArgumentType.STRING, menu: "onOffMenu", defaultValue: "off" },
            },
          },
        ],
        menus: {
          terminalActionsMenu: {
            acceptReporters: false,
            items: ["show", "hide", "clear"],
          },
          logTypesMenu: {
            acceptReporters: true,
            items: [
              "info",
              "hint",
              "warning",
              "error",
              "complete",
              "verbose",
              "loading",
              "headless",
            ],
          },
          loadingStatesMenu: {
            acceptReporters: false,
            items: ["completed", "failed"],
          },
          onOffMenu: {
            acceptReporters: true,
            items: ["on", "off"],
          },
          askTypesMenu: {
            acceptReporters: false,
            items: ["text", "password"],
          },
        },
      };
    }

    manageTerminal(args) {
      const action = args.ACTION;
      if (action === "show") {
        this.visible = true;
        this.canvas.style.display = "block";
        this.draw();
      } else if (action === "hide") {
        if (this.resolveAsk) {
          this.resolveAsk("");
          this.resolveAsk = null;
        }
        this.isAsking = false;
        this.isPassword = false;
        this.focused = false;
        this.currentInput = "";
        this.promptSegments = [];
        this.rawPrompt = "";

        this.visible = false;
        this.canvas.style.display = "none";
      } else if (action === "clear") {
        if (this.resolveAsk) {
          this.resolveAsk("");
          this.resolveAsk = null;
        }
        this.isAsking = false;
        this.isPassword = false;
        this.focused = false;
        this.currentInput = "";
        this.promptSegments = [];
        this.rawPrompt = "";

        this.history = [];
        this.visualLines = [];
        this.activeLoaders = [];
        this.scrollOffset = 0;
        this.draw();
      }
    }

    setOpacity(args) {
      let val = Number(args.OPACITY);
      if (isNaN(val)) val = 85;
      this.opacity = Math.max(0, Math.min(100, val)) / 100;
      this.draw();
    }

    setverbose(args) {
      this.verboseEnabled = args.STATE === "on";
      this.recalculateVisualLines();
      this.draw();
    }

    logMessage(args, util) {
      const msg = args.MESSAGE.toString();
      let type = args.TYPE.toString();
      if (!this.typeStyles[type] && type !== "headless") {
        type = "info";
      }
      const spriteName = util.target.isStage ? "Stage" : util.target.sprite.name;
      this.addLog(type, msg, spriteName);
    }

    replaceLastLine(args) {
      if (this.history.length > 0) {
        const lastLog = this.history[this.history.length - 1];
        lastLog.message = args.MESSAGE.toString();
        this.recalculateVisualLines();
        this.draw();
      }
    }

    closeLoadingGroup(args) {
      if (this.activeLoaders.length > 0) {
        const loader = this.activeLoaders.pop();
        loader.isFinalizedloading = true;
        loader.finalState = args.STATE;
        this.scrollOffset = 0;
        this.recalculateVisualLines();
        this.draw();
      }
    }

    askPrompt(args) {
      return new Promise((resolve) => {
        if (this.isAsking && this.resolveAsk) {
          this.resolveAsk("");
          this.resolveAsk = null;
        }

        this.visible = true;
        this.canvas.style.display = "block";
        this.rawPrompt = args.PROMPT.toString();
        this.promptSegments = this.parseFormatting(this.rawPrompt);
        this.isAsking = true;
        this.isPassword = args.TYPE === "password";
        this.focused = true;
        this.currentInput = "";
        this.scrollOffset = 0;
        this.resolveAsk = resolve;
        this.draw();
      });
    }

    getHistory() {
      return this.history
        .map((log) => {
          if (log.type === "headless") {
            return " ".repeat(log.indent) + log.message;
          }

          const indentStr = " ".repeat(log.indent);
          const tsStr = this.formatTimestamp(log.elapsedTime ?? log.realTime - this.startTime);
          let tagStr = this.typeStyles[log.type] ? this.typeStyles[log.type].tag : "";

          if (log.type === "loading") {
            if (log.isFinalizedloading) {
              tagStr = log.finalState === "failed" ? "{ + }" : "{ X }";
            } else {
              tagStr = "[=  ]";
            }
          }

          const spriteStr = log.spriteName.padEnd(11, " ").substring(0, 11);

          return `${tsStr} ${tagStr} ${spriteStr} : ${indentStr}${log.message}`;
        })
        .join("\n");
    }

    _getMaxChars() {
      const cw = this.charWidth || this.fontSize * 0.55; // Fallback if canvas isn't rendered yet
      return Math.max(1, Math.floor((this.logicalWidth - this.padding * 2) / cw));
    }

    _stripFormatting(text) {
      // Removes tags so string length calculation is accurate for centering/aligning
      return text.replace(/@([chbi])(?:([^:]*))?:(.*?)@\1/g, "$3");
    }

    replaceSpecificLine(args) {
      const lineNum = Math.floor(Number(args.LINE));
      const index = lineNum - 1; // Convert to 0-indexed for the array
      if (index >= 0 && index < this.history.length) {
        this.history[index].message = args.MESSAGE.toString();
        this.recalculateVisualLines();
        this.draw();
      }
    }

    centerText(args) {
      const text = args.TEXT.toString();
      const maxChars = this._getMaxChars();
      const plainLength = this._stripFormatting(text).length;

      if (plainLength >= maxChars) return text;

      const leftSpaces = Math.floor((maxChars - plainLength) / 2);
      const rightSpaces = maxChars - plainLength - leftSpaces;
      return " ".repeat(Math.max(0, leftSpaces)) + text + " ".repeat(Math.max(0, rightSpaces));
    }

    alignRight(args) {
      const text = args.TEXT.toString();
      const maxChars = this._getMaxChars();
      const plainLength = this._stripFormatting(text).length;

      if (plainLength >= maxChars) return text;

      const spaces = maxChars - plainLength;
      return " ".repeat(spaces) + text;
    }

    createProgressBar(args) {
      const val = Number(args.VAL) || 0;
      const max = Number(args.MAX) || 100;
      const len = Math.max(5, Number(args.LEN) || 20);

      const percent = Math.max(0, Math.min(1, val / max));
      const innerLen = len - 2;
      const filled = Math.floor(percent * innerLen);

      const fillChars = "=".repeat(filled);
      const emptyChars = " ".repeat(Math.max(0, innerLen - filled));

      return `[${fillChars}${emptyChars}]`;
    }

    createDivider(args) {
      const char = args.CHAR.toString().charAt(0) || "-";
      const maxChars = this._getMaxChars();
      return char.repeat(maxChars);
    }

    formatTextBuilder(args) {
      let text = args.TEXT.toString();
      if (args.BOLD === "on") text = `@b:${text}@b`;
      if (args.ITALIC === "on") text = `@i:${text}@i`;
      if (args.COLOR) text = `@c ${args.COLOR}:${text}@c`;
      return text;
    }
  }

  TerminalExtension.prototype.setupRuntimeHooks = function () {
    if (typeof Scratch !== "undefined" && Scratch.vm) {
      Scratch.vm.runtime.on("PROJECT_START", () => {
        this.startTime = Date.now();
      });
    }
  };

  TerminalExtension.prototype.setupCanvas = function () {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.canvas.style.position = "absolute";
    this.canvas.style.backgroundColor = "transparent";
    this.canvas.style.zIndex = "400";
    this.canvas.style.display = "none";
    this.canvas.style.cursor = "text";
  };

  TerminalExtension.prototype.setupInputHandlers = function () {
    document.addEventListener(
      "mousedown",
      (e) => {
        if (!this.visible) return;
        this.focused = e.target === this.canvas;
      },
      { capture: true }
    );

    this.canvas.addEventListener("wheel", (e) => {
      if (!this.visible) return;
      e.preventDefault();
      this.scrollOffset -= Math.sign(e.deltaY);
      this.draw();
    });

    document.addEventListener("keydown", (e) => {
      if (!this.visible || !this.isAsking || !this.focused) return;

      if (["INPUT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable) return;

      if (e.key === "Backspace" || e.key === "Enter" || e.key.length === 1) {
        e.preventDefault();
      }

      if (e.key === "Enter") {
        const finalInput = this.currentInput;
        const displayInput = this.isPassword ? "*".repeat(finalInput.length) : finalInput;
        const rawLine = this.rawPrompt + displayInput;

        this.addLog("headless", rawLine, "");

        this.currentInput = "";
        this.isAsking = false;
        this.isPassword = false;
        this.focused = false;
        this.promptSegments = [];
        this.rawPrompt = "";

        if (this.resolveAsk) {
          this.resolveAsk(finalInput);
          this.resolveAsk = null;
        }
      } else if (e.key === "Backspace") {
        this.currentInput = this.currentInput.slice(0, -1);
      } else if (e.key.length === 1) {
        this.currentInput += e.key;
      }

      this.scrollOffset = 0;
      this.draw();
    });
  };

  TerminalExtension.prototype.startRenderLoop = function () {
    this.renderLoop = () => {
      if (this.visible) {
        if (
          typeof Scratch !== "undefined" &&
          Scratch.vm &&
          Scratch.vm.runtime &&
          Scratch.vm.runtime.renderer
        ) {
          const stageCanvas = Scratch.vm.runtime.renderer.canvas;
          const wrapper = stageCanvas.parentElement;

          if (this.canvas.parentElement !== wrapper) {
            wrapper.appendChild(this.canvas);
          }

          const rect = stageCanvas.getBoundingClientRect();
          const wrapperRect = wrapper.getBoundingClientRect();

          const stageWidth = Scratch.vm.runtime.stageWidth || 480;
          const stageHeight = Scratch.vm.runtime.stageHeight || 360;

          const topOffset = rect.top - wrapperRect.top;
          const leftOffset = rect.left - wrapperRect.left;

          if (
            this.canvas.style.width !== `${rect.width}px` ||
            this.canvas.style.height !== `${rect.height}px` ||
            this.canvas.style.top !== `${topOffset}px` ||
            this.canvas.style.left !== `${leftOffset}px`
          ) {
            this.canvas.style.top = `${topOffset}px`;
            this.canvas.style.left = `${leftOffset}px`;
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;
          }

          const dpr = window.devicePixelRatio || 1;
          const physicalWidth = Math.floor(rect.width * dpr);
          const physicalHeight = Math.floor(rect.height * dpr);

          if (
            this.logicalWidth !== stageWidth ||
            this.logicalHeight !== stageHeight ||
            this.canvas.width !== physicalWidth ||
            this.canvas.height !== physicalHeight
          ) {
            this.logicalWidth = stageWidth;
            this.logicalHeight = stageHeight;
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;

            this.ctx.scale(physicalWidth / stageWidth, physicalHeight / stageHeight);
            this.ctx.font = `${this.fontSize}px monospace`;
            this.ctx.textBaseline = "top";
            this.charWidth = this.ctx.measureText("M").width;

            this.recalculateVisualLines();
            this.draw();
          }
        }

        if (this.activeLoaders.length > 0) {
          const currentFrame = Math.floor(Date.now() / 200) % 5;
          if (currentFrame !== this.lastAnimFrame) {
            this.lastAnimFrame = currentFrame;
            this.recalculateVisualLines();
            this.draw();
          }
        }

        if (this.isAsking) {
          this.draw();
        }
      }
      requestAnimationFrame(this.renderLoop);
    };

    this.renderLoop();
  };

  TerminalExtension.prototype.formatTimestamp = function (ms) {
    const sec = Math.max(0, ms / 1000);
    let str;

    if (sec < 10) {
      str = sec.toFixed(4);
    } else if (sec < 100) {
      str = sec.toFixed(3);
    } else if (sec < 1000) {
      str = sec.toFixed(2);
    } else if (sec < 10000) {
      str = sec.toFixed(1);
    } else {
      str = Math.floor(sec).toString().padEnd(6, " ");
    }

    return "[" + str.substring(0, 6) + "]";
  };

  TerminalExtension.prototype.addLog = function (type, message, spriteName) {
    const indent = this.activeLoaders.length * 2;

    const now = Date.now();
    const log = {
      id: now + Math.random(),
      type,
      message,
      spriteName,
      indent,
      realTime: now,
      elapsedTime: now - this.startTime,
      isFinalizedloading: false,
      finalState: null,
    };

    this.history.push(log);

    if (this.history.length > this.historyLimit) {
      const removed = this.history.shift();
      this.activeLoaders = this.activeLoaders.filter((l) => l.id !== removed.id);
    }

    if (type === "loading") {
      this.activeLoaders.push(log);
    }

    this.scrollOffset = 0;
    this.recalculateVisualLines();
    this.draw();
  };

  TerminalExtension.prototype.recalculateVisualLines = function () {
    if (!this.charWidth) return;

    const logicalLines = [];

    for (const log of this.history) {
      if (log.type === "verbose" && !this.verboseEnabled) continue;

      let segments = [];

      if (log.type === "headless") {
        const indentStr = " ".repeat(log.indent);
        segments = this.parseFormatting(indentStr + log.message);
      } else {
        const style = this.typeStyles[log.type] || this.typeStyles["info"];
        const indentStr = " ".repeat(log.indent);
        const tsStr = this.formatTimestamp(log.elapsedTime ?? log.realTime - this.startTime);

        let tagStr = style.tag;
        if (log.type === "loading") {
          if (log.isFinalizedloading) {
            tagStr = log.finalState === "failed" ? "{ + }" : "{ X }";
          } else {
            tagStr = this.animFrames[this.lastAnimFrame];
          }
        }

        const spriteStr = log.spriteName.padEnd(11, " ").substring(0, 11);

        segments.push({
          text: `${tsStr} ${tagStr}`,
          color: style.color,
          bg: null,
          bold: false,
          italic: false,
        });
        segments.push({
          text: ` ${spriteStr} : ${indentStr}`,
          color: style.color,
          bg: null,
          bold: false,
          italic: false,
        });
        segments.push(...this.parseFormatting(log.message));
      }

      logicalLines.push(segments);
    }

    this.visualLines = this.getWrappedLines(logicalLines);
  };

  TerminalExtension.prototype.getWrappedLines = function (logicalLines) {
    const maxChars = Math.max(
      1,
      Math.floor((this.logicalWidth - this.padding * 2) / this.charWidth)
    );
    const wrappedLines = [];

    for (const logicalLine of logicalLines) {
      let currentLine = [];
      let currentLineLength = 0;

      for (const seg of logicalLine) {
        let text = seg.text;
        while (text.length > 0) {
          const spaceLeft = maxChars - currentLineLength;
          const chunk = text.substring(0, spaceLeft);

          if (chunk.length > 0) {
            currentLine.push({ ...seg, text: chunk });
            currentLineLength += chunk.length;
          }

          text = text.substring(spaceLeft);

          if (currentLineLength >= maxChars) {
            wrappedLines.push(currentLine);
            currentLine = [];
            currentLineLength = 0;
          }
        }
      }

      if (
        currentLine.length > 0 ||
        logicalLine.length === 0 ||
        (logicalLine.length === 1 && logicalLine[0].text === "")
      ) {
        wrappedLines.push(currentLine);
      }
    }

    return wrappedLines;
  };

  TerminalExtension.prototype.parseFormatting = function (text, inheritedStyle) {
    const defaultStyle = {
      color: "#FFFFFF",
      bg: null,
      bold: false,
      italic: false,
    };

    const currentStyle = inheritedStyle || defaultStyle;
    const segments = [];

    const regex = /@([chbi])(?:([^:]*))?:(.*?)@\1/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, match.index),
          ...currentStyle,
        });
      }

      const tagType = match[1];
      const arg = match[2];
      const content = match[3];

      const newStyle = { ...currentStyle };

      if (tagType === "c" && arg) newStyle.color = arg.trim();
      else if (tagType === "h" && arg) newStyle.bg = arg.trim();
      else if (tagType === "b") newStyle.bold = true;
      else if (tagType === "i") newStyle.italic = true;

      const innerSegments = this.parseFormatting(content, newStyle);
      segments.push(...innerSegments);

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.substring(lastIndex), ...currentStyle });
    }

    return segments.length > 0 ? segments : [{ text: text, ...currentStyle }];
  };

  TerminalExtension.prototype.draw = function () {
    if (!this.ctx || !this.visible) return;

    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    this.ctx.textBaseline = "middle";

    const displayInput = this.isPassword ? "*".repeat(this.currentInput.length) : this.currentInput;
    const promptWrapped = this.isAsking
      ? this.getWrappedLines([
          [
            ...this.promptSegments,
            {
              text: displayInput,
              color: "#FFFFFF",
              bg: null,
              bold: false,
              italic: false,
            },
          ],
        ])
      : [];

    const totalVisualLines = this.visualLines.concat(promptWrapped);
    const maxVisibleLines = Math.floor((this.logicalHeight - this.padding * 2) / this.lineHeight);
    const activeLinesCount = totalVisualLines.length;
    const maxScroll = Math.max(0, activeLinesCount - maxVisibleLines);
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));

    let startIndex = 0;
    if (activeLinesCount > maxVisibleLines) {
      startIndex = activeLinesCount - maxVisibleLines - this.scrollOffset;
    }

    const endIndex = startIndex + maxVisibleLines;
    let y = this.padding;

    for (let i = startIndex; i < endIndex && i < totalVisualLines.length; i++) {
      let x = this.padding;
      const line = totalVisualLines[i];

      for (const seg of line) {
        const segWidth = seg.text.length * this.charWidth;

        if (seg.bg) {
          this.ctx.fillStyle = seg.bg;
          this.ctx.fillRect(x, y, segWidth, this.lineHeight);
        }

        let fontStyle = "";
        if (seg.italic) fontStyle += "italic ";
        if (seg.bold) fontStyle += "bold ";
        this.ctx.font = `${fontStyle}${this.fontSize}px monospace`;

        this.ctx.fillStyle = seg.color;
        this.ctx.fillText(seg.text, x, y + this.lineHeight / 2);

        x += segWidth;
      }

      this.ctx.font = `${this.fontSize}px monospace`;

      if (this.isAsking && i === totalVisualLines.length - 1) {
        if (this.focused) {
          if (Date.now() % 1000 < 500) {
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillText("█", x, y + this.lineHeight / 2);
          }
        }
      }

      y += this.lineHeight;
    }
  };

  Scratch.extensions.register(new TerminalExtension());
})(Scratch);
