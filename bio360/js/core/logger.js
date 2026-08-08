export class Logger {
  constructor({ debug = false } = {}) { this.debugEnabled = debug; }
  debug(...args) { if (this.debugEnabled) console.debug("[BioLab]", ...args); }
  info(...args) { console.info("[BioLab]", ...args); }
  warn(...args) { console.warn("[BioLab]", ...args); }
  error(...args) { console.error("[BioLab]", ...args); }
}
