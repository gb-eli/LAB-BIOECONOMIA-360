export function createEnvironmentPack(THREE) {
  const materials = {
    rock: new THREE.MeshStandardMaterial({ color: 0x70766d, roughness: 1 }),
    bush: new THREE.MeshStandardMaterial({ color: 0x487e45, roughness: 1 }),
    pallet: new THREE.MeshStandardMaterial({ color: 0x9a724b, roughness: .95 }),
    mulch: new THREE.MeshStandardMaterial({ color: 0x665136, roughness: 1 }),
    compost: new THREE.MeshStandardMaterial({ color: 0x554731, roughness: 1 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x687b78, roughness: .55, metalness: .18 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x577f75, roughness: .72 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x4e5c59, roughness: .58, metalness: .25 })
  };

  return {
    materials,

    createRock({ scale = 1, color = null } = {}) {
      const geometry = new THREE.IcosahedronGeometry(.42 * scale, 0);
      const material = color
        ? new THREE.MeshStandardMaterial({ color, roughness: 1 })
        : materials.rock;

      const rock = new THREE.Mesh(geometry, material);
      rock.scale.set(1.3, .72, 1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      return rock;
    },

    createBush({ scale = 1 } = {}) {
      const group = new THREE.Group();
      const geometry = new THREE.SphereGeometry(.34 * scale, 9, 7);

      for (const [x, y, z, s] of [
        [0, .28, 0, 1],
        [.28, .22, .05, .72],
        [-.24, .2, .08, .68]
      ]) {
        const leaf = new THREE.Mesh(geometry, materials.bush);
        leaf.position.set(x * scale, y * scale, z * scale);
        leaf.scale.setScalar(s);
        group.add(leaf);
      }

      return group;
    },

    createPallet({ width = 1.2, depth = .9 } = {}) {
      const group = new THREE.Group();

      for (let i = 0; i < 5; i++) {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(width, .07, depth / 5.7),
          materials.pallet
        );
        board.position.set(0, .13, -depth / 2 + .11 + i * depth / 5.2);
        group.add(board);
      }

      for (const x of [-width * .37, 0, width * .37]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(.11, .12, depth),
          materials.pallet
        );
        rail.position.set(x, .06, 0);
        group.add(rail);
      }

      return group;
    },

    createCompostPile({ radius = 1.1, height = .8 } = {}) {
      const pile = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 16),
        materials.compost
      );
      pile.position.y = height / 2;
      pile.scale.z = 1.25;
      pile.castShadow = true;
      pile.receiveShadow = true;
      return pile;
    },

    createMiniBiodigester({ radius = .8, height = 1.3 } = {}) {
      const group = new THREE.Group();

      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.05, height, 20),
        materials.darkMetal
      );
      tank.position.y = height / 2;

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(radius * .96, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        materials.plastic
      );
      dome.position.y = height;

      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(.07, .07, 1.4, 8),
        materials.pipe
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(radius + .5, height * .72, 0);

      group.add(tank, dome, pipe);
      return group;
    },

    createSprinkler({ height = .75 } = {}) {
      const group = new THREE.Group();

      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(.035, .045, height, 7),
        materials.pipe
      );
      stand.position.y = height / 2;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(.08, 8, 6),
        materials.darkMetal
      );
      head.position.y = height;

      group.add(stand, head);
      return group;
    },

    createWaterDroplets({ count = 40, color = 0x75d7ef } = {}) {
      const geometry = new THREE.SphereGeometry(.035, 6, 4);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: .72
      });

      const droplets = [];
      for (let i = 0; i < count; i++) {
        const droplet = new THREE.Mesh(geometry, material);
        droplet.visible = false;
        droplets.push(droplet);
      }

      return droplets;
    },

    createCropPlant({ type = "folhosa", scale = 1 } = {}) {
      const group = new THREE.Group();

      if (type === "milho") {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(.025, .035, .7 * scale, 6),
          new THREE.MeshStandardMaterial({ color: 0x5d8b3a, roughness: 1 })
        );
        stem.position.y = .35 * scale;
        group.add(stem);

        for (const side of [-1, 1]) {
          const leaf = new THREE.Mesh(
            new THREE.PlaneGeometry(.16 * scale, .45 * scale),
            new THREE.MeshStandardMaterial({
              color: 0x6ca646,
              side: THREE.DoubleSide,
              roughness: 1
            })
          );
          leaf.position.set(.07 * side * scale, .38 * scale, 0);
          leaf.rotation.z = side * .45;
          group.add(leaf);
        }
        return group;
      }

      if (type === "frutifera") {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(.04, .055, .6 * scale, 6),
          new THREE.MeshStandardMaterial({ color: 0x6d4d33, roughness: 1 })
        );
        trunk.position.y = .3 * scale;

        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(.34 * scale, 10, 7),
          new THREE.MeshStandardMaterial({ color: 0x4f8e4b, roughness: 1 })
        );
        crown.position.y = .72 * scale;

        group.add(trunk, crown);
        return group;
      }

      const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x6ead4b, roughness: 1 });
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(.07 * scale, .26 * scale, 5),
          leafMaterial
        );
        const angle = i / 6 * Math.PI * 2;
        leaf.position.set(
          Math.cos(angle) * .1 * scale,
          .14 * scale,
          Math.sin(angle) * .1 * scale
        );
        leaf.rotation.z = .35;
        leaf.rotation.y = angle;
        group.add(leaf);
      }

      return group;
    }
  };
}
