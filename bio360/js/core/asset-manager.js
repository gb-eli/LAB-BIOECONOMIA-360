export class AssetManager {
  constructor({ logger, events, quality }) {
    this.logger = logger;
    this.events = events;
    this.quality = quality;
    this.cache = new Map();
    this.descriptors = new Map();
  }

  registerDescriptor(descriptor, { baseUrl = document.baseURI } = {}) {
    if (!descriptor?.id) throw new Error("Asset descriptor sem id.");

    const normalized = {
      ...descriptor,
      __baseUrl: new URL(".", baseUrl).href
    };

    this.descriptors.set(normalized.id, normalized);
    return normalized;
  }

  registerManifest(manifest, manifestUrl = document.baseURI) {
    for (const asset of manifest?.assets || []) {
      this.registerDescriptor(asset, { baseUrl: manifestUrl });
    }
  }

  descriptor(id) {
    return this.descriptors.get(id) || null;
  }

  createScope(scopeId) {
    const owned = new Map();
    let released = false;

    const retain = key => {
      owned.set(key, (owned.get(key) || 0) + 1);
    };

    return {
      id: scopeId,

      loadJSON: async url => {
        const key = this.resolve(url);
        retain(key);
        return this.loadJSON(key);
      },

      loadManifest: async url => {
        const key = this.resolve(url);
        retain(key);
        const manifest = await this.loadJSON(key);
        this.registerManifest(manifest, key);
        return manifest;
      },

      loadGLTF: async url => {
        const key = this.resolve(url);
        retain(key);
        return this.loadGLTF(key);
      },

      loadTexture: async url => {
        const key = this.resolve(url);
        retain(key);
        return this.loadTexture(key);
      },

      loadAsset: async (assetId, options = {}) => {
        const resolved = this.resolveAsset(assetId, options);
        if (!resolved) throw new Error(`Asset não registrado: ${assetId}`);

        retain(resolved.url);

        if (resolved.type === "model") {
          return this.loadGLTF(resolved.url, {
            draco: resolved.draco,
            ktx2: resolved.ktx2
          });
        }

        if (resolved.type === "json") return this.loadJSON(resolved.url);
        if (resolved.type === "texture" || resolved.type === "panorama") {
          return this.loadTexture(resolved.url, {
            colorSpace:resolved.colorSpace || (resolved.type === "panorama" ? "srgb" : "srgb"),
            anisotropy:resolved.anisotropy
          });
        }
        throw new Error(`Tipo de asset não suportado: ${resolved.type}`);
      },

      release: () => {
        if (released) return;
        released = true;

        for (const [key, count] of owned) {
          for (let i = 0; i < count; i++) this.release(key);
        }
        owned.clear();
      }
    };
  }

  resolve(url, baseUrl = document.baseURI) {
    return new URL(url, baseUrl).href;
  }

  resolveAsset(assetId, { profileId } = {}) {
    const descriptor = this.descriptor(assetId);
    if (!descriptor) return null;

    const selectedProfile = profileId || this.quality?.current?.id || "balanced";
    const variants = descriptor.variants || {};

    const path =
      variants[selectedProfile] ||
      variants.balanced ||
      variants.high ||
      variants.eco ||
      descriptor.path;

    if (!path) return null;

    return {
      id: descriptor.id,
      type: descriptor.type,
      format: descriptor.format,
      profileId: selectedProfile,
      url: this.resolve(path, descriptor.__baseUrl || document.baseURI),
      draco: Boolean(descriptor.draco),
      ktx2: Boolean(descriptor.ktx2),
      colorSpace: descriptor.colorSpace || null,
      anisotropy: descriptor.anisotropy || null
    };
  }

  async loadJSON(url) {
    return this.#load(url, "json", async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return response.json();
    });
  }

  async loadTexture(url, { colorSpace = "srgb", anisotropy = 2 } = {}) {
    return this.#load(url, "texture", async () => {
      const THREE = await import("three");
      const loader = new THREE.TextureLoader();
      const texture = await loader.loadAsync(url);
      texture.colorSpace = colorSpace === "data"
        ? (THREE.NoColorSpace || "")
        : THREE.SRGBColorSpace;
      texture.anisotropy = Math.max(1, Number(anisotropy || 2));
      texture.needsUpdate = true;
      return texture;
    });
  }

  async loadGLTF(url, { draco = false, ktx2 = false } = {}) {
    return this.#load(url, "gltf", async () => {
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();

      if (draco) {
        const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/");
        loader.setDRACOLoader(dracoLoader);
      }

      if (ktx2) {
        this.logger.info("Asset marcado para KTX2; configuração dependente do renderer será aplicada com o primeiro asset KTX2 real.");
      }

      return loader.loadAsync(url);
    });
  }

  async #load(key, type, factory) {
    let record = this.cache.get(key);

    if (!record) {
      record = {
        key,
        type,
        refs: 0,
        value: null,
        promise: null,
        error: null
      };

      record.promise = (async () => {
        this.events.emit("asset:loading", { key, type });
        try {
          record.value = await factory();
          this.events.emit("asset:loaded", { key, type });
          return record.value;
        } catch (error) {
          record.error = error;
          this.cache.delete(key);
          this.events.emit("asset:error", { key, type, error });
          throw error;
        }
      })();

      this.cache.set(key, record);
    }

    record.refs++;
    return record.promise;
  }

  release(keyOrUrl) {
    const key = this.cache.has(keyOrUrl) ? keyOrUrl : this.resolve(keyOrUrl);
    const record = this.cache.get(key);
    if (!record) return;

    record.refs = Math.max(0, record.refs - 1);
    if (record.refs > 0) return;

    if (record.type === "gltf" && record.value) {
      disposeObject(record.value.scene);
    }

    if (record.type === "texture" && record.value) {
      record.value.dispose?.();
    }

    this.cache.delete(key);
    this.events.emit("asset:released", { key, type: record.type });
  }

  stats() {
    return {
      cached: this.cache.size,
      descriptors: this.descriptors.size,
      items: [...this.cache.values()].map(item => ({
        key: item.key,
        type: item.type,
        refs: item.refs
      }))
    };
  }
}

function disposeObject(root) {
  if (!root?.traverse) return;

  root.traverse(object => {
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
}
