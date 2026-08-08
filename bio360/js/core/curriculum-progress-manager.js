export class CurriculumProgressManager {
  constructor({ evidence, events }) {
    this.evidence = evidence;
    this.events = events;
  }

  build(manifests = []) {
    const records = this.evidence.list();
    const modulesById = new Map(manifests.map(manifest => [manifest.id, manifest]));
    const units = new Map();

    for (const manifest of manifests) {
      const curriculumUnits = manifest.curriculum?.units || [];

      for (const unitName of curriculumUnits) {
        if (!units.has(unitName)) {
          units.set(unitName, {
            unit: unitName,
            packageIds: new Set(),
            evidenceCount: 0,
            completedScenarios: new Set(),
            lastActivityAt: null
          });
        }
        units.get(unitName).packageIds.add(manifest.id);
      }
    }

    for (const record of records) {
      const manifest = modulesById.get(record.moduleId);
      if (!manifest) continue;

      for (const unitName of manifest.curriculum?.units || []) {
        if (!units.has(unitName)) continue;

        const item = units.get(unitName);
        item.evidenceCount++;

        if (record.scenarioId) {
          item.completedScenarios.add(`${record.moduleId}:${record.scenarioId}`);
        }

        if (!item.lastActivityAt || record.createdAt > item.lastActivityAt) {
          item.lastActivityAt = record.createdAt;
        }
      }
    }

    return [...units.values()]
      .map(item => {
        const packageCount = item.packageIds.size;
        const scenarioCount = item.completedScenarios.size;

        // A didactic local progress score, not an official grade.
        const progress = Math.min(
          100,
          Math.round(
            (Math.min(packageCount, 4) * 8) +
            (Math.min(scenarioCount, 6) * 10) +
            (Math.min(item.evidenceCount, 4) * 2)
          )
        );

        return {
          unit: item.unit,
          packageCount,
          scenarioCount,
          evidenceCount: item.evidenceCount,
          lastActivityAt: item.lastActivityAt,
          progress
        };
      })
      .sort((a, b) => b.progress - a.progress || a.unit.localeCompare(b.unit, "pt-BR"));
  }

  summary(manifests = []) {
    const units = this.build(manifests);
    return {
      unitCount: units.length,
      activeUnits: units.filter(item => item.evidenceCount > 0).length,
      evidenceCount: this.evidence.list().length,
      averageProgress: units.length
        ? Math.round(units.reduce((sum, item) => sum + item.progress, 0) / units.length)
        : 0,
      units
    };
  }
}
