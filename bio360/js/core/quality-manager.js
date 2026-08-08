export class QualityManager {
  constructor({ storage, events, logger }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;

    this.profiles = {
      eco: {
        id: "eco",
        label: "ECO",
        rank: 0,
        maxDpr: 1,
        detail: 0.42,
        vegetation: 18,
        particles: 8,
        targetFps: 30,
        shadows: false,
        shadowMap: 512,
        animationScale: 0.55,
        lodBias: 1.35
      },
      balanced: {
        id: "balanced",
        label: "BALANCEADO",
        rank: 1,
        maxDpr: 1.25,
        detail: 0.68,
        vegetation: 42,
        particles: 22,
        targetFps: 45,
        shadows: false,
        shadowMap: 768,
        animationScale: 0.82,
        lodBias: 1
      },
      high: {
        id: "high",
        label: "ALTO",
        rank: 2,
        maxDpr: 1.5,
        detail: 0.88,
        vegetation: 70,
        particles: 38,
        targetFps: 55,
        shadows: true,
        shadowMap: 1024,
        animationScale: 1,
        lodBias: 0.8
      },
      ultra: {
        id: "ultra",
        label: "ULTRA",
        rank: 3,
        maxDpr: 1.75,
        detail: 1,
        vegetation: 96,
        particles: 56,
        targetFps: 60,
        shadows: true,
        shadowMap: 1536,
        animationScale: 1,
        lodBias: 0.68
      }
    };

    const saved = this.storage.get("settings.graphicProfile", null);
    this.currentId = this.profiles[saved] ? saved : this.suggestProfile();

    this.autoEnabled = this.storage.get("settings.autoQuality", true) !== false;
    this.lowSamples = 0;
    this.highSamples = 0;
    this.lastAutoChange = 0;
    this.cooldownMs = 18000;
    this.minimumUptimeMs = 8000;

    this.performanceUnsub = this.events.on("performance:sample", sample => {
      this.evaluatePerformance(sample);
    });
  }

  suggestProfile() {
    const memory = Number(navigator.deviceMemory || 4);
    const cores = Number(navigator.hardwareConcurrency || 4);
    const smallScreen = Math.min(innerWidth, innerHeight) < 600;

    if (memory <= 2 || cores <= 2) return "eco";
    if (smallScreen || memory <= 4 || cores <= 4) return "balanced";
    if (memory >= 8 && cores >= 8) return "high";
    return "balanced";
  }

  get current() {
    return this.profiles[this.currentId];
  }

  list() {
    return Object.values(this.profiles);
  }

  set(profileId, { persist = true, reason = "manual" } = {}) {
    if (!this.profiles[profileId]) return this.current;

    const previous = this.currentId;
    this.currentId = profileId;

    if (persist) {
      this.storage.set("settings.graphicProfile", profileId);
    }

    if (previous !== profileId) {
      this.logger.info("Perfil gráfico alterado", { profileId, reason });
      this.events.emit("quality:changed", {
        previous,
        profileId,
        profile: this.current,
        reason
      });
    }

    return this.current;
  }

  setAutoEnabled(enabled) {
    this.autoEnabled = Boolean(enabled);
    this.storage.set("settings.autoQuality", this.autoEnabled);
    this.lowSamples = 0;
    this.highSamples = 0;
    this.events.emit("quality:auto-changed", { enabled: this.autoEnabled });
    return this.autoEnabled;
  }

  isAutoEnabled() {
    return this.autoEnabled;
  }

  evaluatePerformance(sample) {
    if (!this.autoEnabled) return;
    if (document.hidden) return;
    if (!sample || !Number.isFinite(sample.fps) || sample.fps <= 0) return;
    if ((sample.uptime || 0) < this.minimumUptimeMs) return;

    const now = performance.now();
    if (now - this.lastAutoChange < this.cooldownMs) return;

    const profile = this.current;
    const target = profile.targetFps;
    const lowThreshold = target * 0.72;
    const highThreshold = target * 0.96;

    if (sample.fps < lowThreshold) {
      this.lowSamples++;
      this.highSamples = 0;
    } else if (sample.fps >= highThreshold) {
      this.highSamples++;
      this.lowSamples = 0;
    } else {
      this.lowSamples = Math.max(0, this.lowSamples - 1);
      this.highSamples = Math.max(0, this.highSamples - 1);
    }

    // Degrade faster than upgrade. This prevents oscillation.
    if (this.lowSamples >= 8) {
      const next = this.byRank(profile.rank - 1);
      if (next) {
        this.lastAutoChange = now;
        this.lowSamples = 0;
        this.highSamples = 0;
        this.set(next.id, { reason: "auto-performance" });
        this.events.emit("quality:auto-adjusted", {
          direction: "down",
          from: profile.id,
          to: next.id,
          fps: sample.fps
        });
      }
      return;
    }

    // Upgrade only after a longer stable period.
    if (this.highSamples >= 40) {
      const next = this.byRank(profile.rank + 1);
      if (next) {
        this.lastAutoChange = now;
        this.lowSamples = 0;
        this.highSamples = 0;
        this.set(next.id, { reason: "auto-performance" });
        this.events.emit("quality:auto-adjusted", {
          direction: "up",
          from: profile.id,
          to: next.id,
          fps: sample.fps
        });
      }
    }
  }

  byRank(rank) {
    return Object.values(this.profiles).find(profile => profile.rank === rank) || null;
  }

  dispose() {
    this.performanceUnsub?.();
  }
}
