export function createSceneKit(THREE) {
  const materials = {
    trunk: new THREE.MeshStandardMaterial({ color: 0x654a32, roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x438b50, roughness: 1 }),
    grass: new THREE.MeshStandardMaterial({ color: 0x315e3d, roughness: 1 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x76583b, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8a6544, roughness: .95 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x758582, roughness: .58, metalness: .18 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x7d8580, roughness: .92 }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x319db7, roughness: .28, transparent: true, opacity: .78
    })
  };

  return {
    materials,

    addGround(scene, {
      width = 22,
      depth = 18,
      color = 0x315e3d,
      y = 0
    } = {}) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshStandardMaterial({ color, roughness: 1 })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    },

    createTree({ height = 1.9, crown = .7, color = 0x438b50 } = {}) {
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(.09, .13, height * .45, 7),
        materials.trunk
      );
      trunk.position.y = height * .225;

      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(crown, height * .72, 8),
        color === 0x438b50
          ? materials.foliage
          : new THREE.MeshStandardMaterial({ color, roughness: 1 })
      );
      leaves.position.y = height * .72;

      group.add(trunk, leaves);
      group.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      return group;
    },

    createFence({
      length = 6,
      posts = 7,
      height = .8,
      color = 0x8a6544
    } = {}) {
      const group = new THREE.Group();
      const material = color === 0x8a6544
        ? materials.wood
        : new THREE.MeshStandardMaterial({ color, roughness: .95 });

      for (let i = 0; i < posts; i++) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(.09, height, .09),
          material
        );
        post.position.set(-length / 2 + (length * i / (posts - 1)), height / 2, 0);
        group.add(post);
      }

      for (const y of [height * .33, height * .68]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(length, .08, .08),
          material
        );
        rail.position.y = y;
        group.add(rail);
      }

      return group;
    },

    createShed({
      width = 3,
      height = 1.7,
      depth = 2,
      wallColor = 0xa58665,
      roofColor = 0x704d3a
    } = {}) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: wallColor, roughness: .92 })
      );
      body.position.y = height / 2;

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(width, depth) * .72, .8, 4),
        new THREE.MeshStandardMaterial({ color: roofColor, roughness: 1 })
      );
      roof.position.y = height + .35;
      roof.rotation.y = Math.PI / 4;

      group.add(body, roof);
      group.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      return group;
    },

    createWaterTrough({
      width = 2.1,
      height = .55,
      depth = .75
    } = {}) {
      const group = new THREE.Group();
      const shell = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        materials.metal
      );
      shell.position.y = height / 2;

      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(width * .85, depth * .72),
        materials.water
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = height + .01;

      group.add(shell, water);
      return group;
    },

    createFieldRows({
      rows = 8,
      length = 6,
      spacing = .42,
      plantColor = 0x83b84b
    } = {}) {
      const group = new THREE.Group();
      const soil = materials.soil;
      const plant = new THREE.MeshStandardMaterial({ color: plantColor, roughness: 1 });

      for (let r = 0; r < rows; r++) {
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(length, .1, .18),
          soil
        );
        bed.position.set(0, .05, (r - (rows - 1) / 2) * spacing);
        group.add(bed);

        const plantCount = Math.max(5, Math.round(length / .45));
        for (let i = 0; i < plantCount; i++) {
          const leaf = new THREE.Mesh(
            new THREE.ConeGeometry(.08, .22, 6),
            plant
          );
          leaf.position.set(
            -length / 2 + .25 + i * ((length - .5) / (plantCount - 1)),
            .18,
            bed.position.z
          );
          group.add(leaf);
        }
      }
      return group;
    },

    createAnimalMarker({
      bodyColor = 0xc7b69c,
      scale = 1
    } = {}) {
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: .9 });

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(.45 * scale, 12, 8),
        material
      );
      body.scale.set(1.3, .75, .75);
      body.position.y = .55 * scale;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(.24 * scale, 10, 7),
        material
      );
      head.position.set(.55 * scale, .68 * scale, 0);

      group.add(body, head);

      for (const x of [-.28, .28]) {
        for (const z of [-.22, .22]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(.055 * scale, .055 * scale, .42 * scale, 6),
            material
          );
          leg.position.set(x * scale, .22 * scale, z * scale);
          group.add(leg);
        }
      }

      return group;
    }
  };
}

export function createInstancedTrees(THREE, {
  count = 80,
  radiusX = 8,
  radiusZ = 6,
  centerX = 0,
  centerZ = 0,
  seed = 1,
  color = 0x438b50
} = {}) {
  const trunkGeometry = new THREE.CylinderGeometry(.06, .09, .5, 6);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x654a32, roughness: 1 });
  const crownGeometry = new THREE.ConeGeometry(.3, .78, 7);
  const crownMaterial = new THREE.MeshStandardMaterial({ color, roughness: 1 });

  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const a = (i + seed) * 2.399963;
    const radial = .25 + ((i * 37 + seed * 17) % 100) / 100 * .75;
    const x = centerX + Math.cos(a) * radiusX * radial;
    const z = centerZ + Math.sin(a) * radiusZ * radial;
    const scale = .78 + ((i * 19) % 12) / 40;

    dummy.position.set(x, .25, z);
    dummy.rotation.y = a;
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, .82, z);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
  }

  return { trunks, crowns, count };
}
