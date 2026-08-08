export class ThreeRuntime {
  constructor({ quality, events, logger, telemetry = null, visualBaselines = null }) {
    this.quality = quality;
    this.events = events;
    this.logger = logger;
    this.telemetry = telemetry;
    this.visualBaselines = visualBaselines;
    this.modulePromise = null;
  }

  supportsWebGL() {
    if (new URLSearchParams(location.search).get("force2d") === "1") return false;

    try {
      const canvas = document.createElement("canvas");
      return !!(
        canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true })
      );
    } catch {
      return false;
    }
  }

  async modules() {
    if (!this.modulePromise) {
      this.modulePromise = Promise.all([
        import("three"),
        import("three/addons/controls/OrbitControls.js")
      ]).then(([THREE, controls]) => ({
        THREE,
        OrbitControls: controls.OrbitControls
      }));
    }

    return this.modulePromise;
  }

  async createViewport({
    canvas,
    container,
    cameraPosition = [12, 11, 14],
    target = [0, 0, 0],
    background = 0x081612,
    enablePan = false
  }) {
    if (!this.supportsWebGL()) {
      throw new Error("WebGL indisponível ou modo 2D solicitado.");
    }

    const { THREE, OrbitControls } = await this.modules();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.quality.current.id !== "eco",
      powerPreference: "high-performance"
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    scene.fog = new THREE.Fog(background, 24, 54);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 140);
    camera.position.set(...cameraPosition);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = enablePan;
    controls.minDistance = 7;
    controls.maxDistance = 38;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      return { width, height };
    };

    const applyQuality = () => {
      const profile = this.quality.current;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, profile.maxDpr));
      renderer.shadowMap.enabled = profile.shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      resize();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const unsubscribeQuality = this.events.on("quality:changed", applyQuality);
    applyQuality();

    const telemetrySession=this.telemetry?.attachViewport?.({
      id:canvas?.id || container?.id || "three-viewport",
      renderer,
      scene,
      camera
    }) || null;

    return {
      THREE,
      renderer,
      scene,
      camera,
      controls,
      resize,
      applyQuality,

      createLOD: ({ levels = [] }) => {
        const lod = new THREE.LOD();
        const bias = this.quality.current.lodBias || 1;

        for (const level of levels) {
          if (!level?.object) continue;
          lod.addLevel(level.object, (level.distance || 0) * bias);
        }

        return lod;
      },

      dispose: () => {
        observer.disconnect();
        unsubscribeQuality?.();
        controls.dispose();

        // Render one final frame and copy it synchronously before WebGL resources
        // are released. This makes the visual baseline more reliable even with
        // preserveDrawingBuffer=false (the default and preferred runtime mode).
        try {
          renderer.render(scene, camera);
          this.visualBaselines?.capture?.({
            sceneId: canvas?.id || container?.id || "three-viewport",
            profileId: this.quality.current.id,
            canvas: renderer.domElement
          });
        } catch (error) {
          this.logger?.warn?.("Baseline visual não capturado.", error);
        }

        scene.traverse(object => {
          object.geometry?.dispose?.();

          const materials = Array.isArray(object.material)
            ? object.material
            : object.material ? [object.material] : [];

          for (const material of materials) {
            for (const value of Object.values(material)) {
              if (value?.isTexture) value.dispose?.();
            }
            material.dispose?.();
          }
        });

        telemetrySession?.finish?.();
        renderer.renderLists?.dispose?.();
        renderer.dispose();
      }
    };
  }
}
