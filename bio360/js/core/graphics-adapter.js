export class GraphicsAdapter {
  constructor({ quality }) {
    this.quality = quality;
  }

  fitCanvas(canvas, container = canvas.parentElement) {
    const rect = container.getBoundingClientRect();
    const profile = this.quality.current;
    const dpr = Math.min(devicePixelRatio || 1, profile.maxDpr);

    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width, height, dpr, ctx };
  }
}
