const SECTION_KEYS = [
  "territory",
  "governance",
  "production",
  "processing",
  "circularity",
  "marketing",
  "tourism",
  "finance"
];

function emptySections() {
  return Object.fromEntries(SECTION_KEYS.map(key => [key, {}]));
}

export class ProjectManager {
  constructor({ storage, events, logger }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
    this.key = "projects.integrator";
    this.maxProjects = 20;
  }

  list() {
    const projects = this.storage.get(this.key, []);
    if (!Array.isArray(projects)) return [];

    return projects.map(project => ({
      ...project,
      sections: {
        ...emptySections(),
        ...(project.sections || {})
      },
      evidenceIds: Array.isArray(project.evidenceIds) ? project.evidenceIds : [],
      transferIds: Array.isArray(project.transferIds) ? project.transferIds : []
    }));
  }

  get(projectId) {
    return this.list().find(project => project.id === projectId) || null;
  }

  create({ name = "Novo Projeto de Bioeconomia" } = {}) {
    const now = new Date().toISOString();
    const project = {
      id: globalThis.crypto?.randomUUID?.() || `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      createdAt: now,
      updatedAt: now,
      status: "rascunho",
      sections: emptySections(),
      notes: "",
      evidenceIds: [],
      transferIds: []
    };

    const list = this.list();
    list.unshift(project);
    this.storage.set(this.key, list.slice(0, this.maxProjects));
    this.events.emit("project:created", { project });
    return project;
  }

  update(projectId, patch = {}) {
    const list = this.list();
    const index = list.findIndex(project => project.id === projectId);
    if (index < 0) return null;

    const current = list[index];
    const next = {
      ...current,
      ...patch,
      sections: {
        ...emptySections(),
        ...current.sections,
        ...(patch.sections || {})
      },
      updatedAt: new Date().toISOString()
    };

    list[index] = next;
    this.storage.set(this.key, list);
    this.events.emit("project:updated", { project: next });
    return next;
  }

  delete(projectId) {
    const list = this.list().filter(project => project.id !== projectId);
    this.storage.set(this.key, list);
    this.events.emit("project:deleted", { projectId });
  }

  attachEvidence(projectId, evidenceId) {
    const project = this.get(projectId);
    if (!project) return null;

    const evidenceIds = [...new Set([...(project.evidenceIds || []), evidenceId])];
    return this.update(projectId, { evidenceIds });
  }

  attachTransfer(projectId, transferId) {
    const project = this.get(projectId);
    if (!project) return null;

    const transferIds = [...new Set([...(project.transferIds || []), transferId])];
    return this.update(projectId, { transferIds });
  }

  progress(project) {
    if (!project) return 0;

    const completed = SECTION_KEYS.filter(key => {
      const section = project.sections?.[key] || {};
      return Object.values(section).some(value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      );
    }).length;

    return Math.round((completed / SECTION_KEYS.length) * 100);
  }

  sectionKeys() {
    return [...SECTION_KEYS];
  }

  downloadJSON(project, filename = null) {
    if (!project) return;

    const blob = new Blob(
      [JSON.stringify({
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        project
      }, null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || `projeto-bioeconomia-${slugify(project.name || project.id)}.json`;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "projeto";
}
