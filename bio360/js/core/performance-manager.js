export class PerformanceManager {
  constructor({ events }) {
    this.events = events;
    this.sessions = new Map();
  }

  createSession(id) {
    const startedAt = performance.now();
    const state = {
      id,
      lastTick: startedAt,
      lastFrameAt: startedAt,
      frameCount: 0,
      fps: 0,
      frameMs: 16.7,
      smoothedMs: 16.7,
      startedAt
    };

    this.sessions.set(id, state);

    return {
      sample: (now = performance.now()) => {
        const dt = Math.max(0.1, now - state.lastFrameAt);
        state.lastFrameAt = now;
        state.smoothedMs = state.smoothedMs * 0.9 + dt * 0.1;
        state.frameMs = state.smoothedMs;
        state.frameCount++;

        const elapsed = now - state.lastTick;
        if (elapsed >= 500) {
          state.fps = Math.round((state.frameCount * 1000) / elapsed);
          state.frameCount = 0;
          state.lastTick = now;

          this.events.emit("performance:sample", {
            id,
            fps: state.fps,
            frameMs: state.frameMs,
            uptime: now - state.startedAt
          });
        }

        return {
          fps: state.fps,
          frameMs: state.frameMs,
          uptime: now - state.startedAt
        };
      },

      snapshot: () => ({
        fps: state.fps,
        frameMs: state.frameMs,
        uptime: performance.now() - state.startedAt
      }),

      dispose: () => {
        this.sessions.delete(id);
      }
    };
  }
}
