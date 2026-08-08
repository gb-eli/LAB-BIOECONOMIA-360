export function createFlowKit(THREE) {
  return {
    createArrow({
      from = new THREE.Vector3(),
      to = new THREE.Vector3(1, 0, 0),
      color = 0x57d6a3,
      width = .055
    } = {}) {
      const direction = to.clone().sub(from);
      const length = direction.length();
      const curve = new THREE.LineCurve3(from, to);

      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 1, width, 7, false),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: .12,
          roughness: .6
        })
      );

      const head = new THREE.Mesh(
        new THREE.ConeGeometry(width * 3.2, width * 7, 8),
        new THREE.MeshStandardMaterial({ color, roughness: .7 })
      );

      head.position.copy(to);
      head.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );

      return { tube, head, length };
    },

    createParticles({
      count = 24,
      color = 0x82ebc2,
      radius = .055
    } = {}) {
      const geometry = new THREE.SphereGeometry(radius, 7, 5);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: .8
      });

      const particles = [];
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        particles.push(mesh);
      }
      return particles;
    },

    animateParticles({
      particles,
      from,
      to,
      time,
      visibleCount = particles.length,
      speed = .18
    }) {
      const direction = to.clone().sub(from);

      particles.forEach((particle, index) => {
        particle.visible = index < visibleCount;
        if (!particle.visible) return;

        const t = (time * speed + index / Math.max(1, visibleCount)) % 1;
        particle.position.copy(from).addScaledVector(direction, t);
        particle.position.y += Math.sin(t * Math.PI) * .18;
      });
    }
  };
}
