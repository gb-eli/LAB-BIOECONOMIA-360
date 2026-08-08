import { EventBus } from "./core/event-bus.js";
import { StorageManager } from "./core/storage-manager.js";
import { Router } from "./core/router.js";
import { ModuleLoader } from "./core/module-loader.js";
import { ModuleRegistry } from "./core/module-registry.js";
import { Logger } from "./core/logger.js";
import { UIManager } from "./ui/ui-manager.js";
import { QualityManager } from "./core/quality-manager.js";
import { PerformanceManager } from "./core/performance-manager.js";
import { GraphicsAdapter } from "./core/graphics-adapter.js";
import { AssetManager } from "./core/asset-manager.js";
import { ThreeRuntime } from "./core/three-runtime.js";
import { ScenarioEngine } from "./core/scenario-engine.js";
import { EvidenceManager } from "./core/evidence-manager.js";
import { CurriculumProgressManager } from "./core/curriculum-progress-manager.js";
import { LabContextManager } from "./core/lab-context-manager.js";
import { ProjectManager } from "./core/project-manager.js";
import { PortfolioExporter } from "./core/portfolio-exporter.js";
import { IntegratedJourneyManager } from "./core/integrated-journey-manager.js";
import { ProductPassportManager } from "./core/product-passport-manager.js";
import { MultiLabMissionEngine } from "./core/multilab-mission-engine.js";
import { ConsequenceManager } from "./core/consequence-manager.js";
import { MultiLabEventEngine } from "./core/multilab-event-engine.js";
import { MultiLabBranchEngine } from "./core/multilab-branch-engine.js";
import { MissionOutcomeEvaluator } from "./core/mission-outcome-evaluator.js";
import { MissionTimelineManager } from "./core/mission-timeline-manager.js";
import { MultiLabReportBuilder } from "./core/multilab-report-builder.js";
import { MultiLabSessionHistory } from "./core/multilab-session-history.js";
import { MultiLabComparisonManager } from "./core/multilab-comparison-manager.js";
import { Panorama360Engine } from "./core/panorama360-engine.js";
import { AmbientAudioManager } from "./core/ambient-audio-manager.js";
import { PBRMaterialLibrary } from "./graphics/pbr-material-library.js";
import { EnvironmentLightingManager } from "./graphics/environment-lighting-manager.js";
import { SpatialAudioManager } from "./core/spatial-audio-manager.js";
import { ImmersiveBridge } from "./core/immersive-bridge.js";
import { RuntimeQualityGovernor } from "./graphics/runtime-quality-governor.js";
import { GraphicsTelemetryManager } from "./core/graphics-telemetry-manager.js";
import { GraphicsBudgetCatalog } from "./graphics/graphics-budget-catalog.js";
import { GraphicsBenchmarkManager } from "./core/graphics-benchmark-manager.js";
import { GraphicsBudgetStore } from "./core/graphics-budget-store.js";
import { GraphicsVisualBaselineManager } from "./core/graphics-visual-baseline-manager.js";
import { GraphicsRegressionReportBuilder } from "./core/graphics-regression-report-builder.js";
import { GraphicsOptimizationQueue } from "./core/graphics-optimization-queue.js";
import { GuidedBenchmarkManager } from "./core/guided-benchmark-manager.js";
import { createGuidedBenchmarkBanner } from "./ui/guided-benchmark-banner.js";
import { DeviceProfileManager } from "./core/device-profile-manager.js";
import { BenchmarkBundleManager } from "./core/benchmark-bundle-manager.js";
import { MultiLabInspectionManager } from "./core/multilab-inspection-manager.js";
import { MultiLabSessionBundleManager } from "./core/multilab-session-bundle-manager.js";
import { startApp } from "./app.js";

const APP_VERSION="0.42.0-alpha";
const debug = new URLSearchParams(location.search).get("dev") === "1";

const logger = new Logger({ debug });
const events = new EventBus();
const storage = new StorageManager("bioeconomia");

const ui = new UIManager({
  view: document.querySelector("#app-view"),
  overlay: document.querySelector("#app-overlay")
});

const quality = new QualityManager({ storage, events, logger });
const performance = new PerformanceManager({ events });
const graphics = new GraphicsAdapter({ quality });
const assets = new AssetManager({ logger, events, quality });
const deviceProfile = new DeviceProfileManager({
  storage,events,appVersion:APP_VERSION
});
deviceProfile.current();

const graphicsBudgets = new GraphicsBudgetCatalog();
const graphicsBudgetStore = new GraphicsBudgetStore({
  storage, events, catalog:graphicsBudgets, appVersion:APP_VERSION
});
graphicsBudgetStore.ensureVersion(APP_VERSION);

const graphicsTelemetry = new GraphicsTelemetryManager({
  storage,
  events,
  quality,
  logger,
  appVersion:APP_VERSION,
  deviceProfile
});
const graphicsVisualBaselines = new GraphicsVisualBaselineManager({
  storage,
  events,
  appVersion:APP_VERSION,
  maxEntries:24,
  allowedSceneIds:graphicsBudgets.sceneIds()
});
const graphicsBenchmark = new GraphicsBenchmarkManager({
  telemetry:graphicsTelemetry,
  budgets:graphicsBudgets,
  budgetStore:graphicsBudgetStore,
  storage,
  events,
  appVersion:APP_VERSION,
  logger
});
const graphicsRegressionReport = new GraphicsRegressionReportBuilder({
  benchmark:graphicsBenchmark,
  visualBaselines:graphicsVisualBaselines,
  appVersion:APP_VERSION
});
const graphicsOptimizationQueue = new GraphicsOptimizationQueue({
  storage,
  events,
  reportBuilder:graphicsRegressionReport,
  appVersion:APP_VERSION
});

const guidedBenchmark = new GuidedBenchmarkManager({
  storage,
  events,
  quality,
  telemetry:graphicsTelemetry,
  benchmark:graphicsBenchmark,
  visualBaselines:graphicsVisualBaselines,
  appVersion:APP_VERSION
});

const benchmarkBundle = new BenchmarkBundleManager({
  storage,
  events,
  telemetry:graphicsTelemetry,
  benchmark:graphicsBenchmark,
  budgetStore:graphicsBudgetStore,
  visualBaselines:graphicsVisualBaselines,
  guidedBenchmark,
  deviceProfile,
  appVersion:APP_VERSION
});

const three = new ThreeRuntime({
  quality, events, logger, telemetry:graphicsTelemetry, visualBaselines:graphicsVisualBaselines
});
const panorama360 = new Panorama360Engine({ three, quality, events, logger, performance });
const audio = new AmbientAudioManager({ assets, storage, events, logger });
const pbr = new PBRMaterialLibrary({ three, quality, logger });
const environmentLighting = new EnvironmentLightingManager({ three, quality, logger });
const spatialAudio = new SpatialAudioManager({ logger, events, storage });
const immersiveBridge = new ImmersiveBridge({ storage, events });
const runtimeQuality = new RuntimeQualityGovernor({ quality, events, logger });
const scenarios = new ScenarioEngine({ events, storage, logger });
const evidence = new EvidenceManager({ events, storage, logger });
const curriculumProgress = new CurriculumProgressManager({ evidence, events });
const labContext = new LabContextManager({ storage, events, logger });
const passport = new ProductPassportManager({ storage, events, logger });
const consequences = new ConsequenceManager({ storage, events, passport, logger });
const multiEvents = new MultiLabEventEngine({ storage, events, logger, consequences, labContext, passport });
const branches = new MultiLabBranchEngine({ storage, events, logger, multiEvents, labContext, evidence });
const projects = new ProjectManager({ storage, events, logger });
const outcomes = new MissionOutcomeEvaluator({ labContext, consequences, passport });
const journey = new IntegratedJourneyManager({ labContext, storage, projects, events, passport });
const multilab = new MultiLabMissionEngine({ storage, events, logger, labContext, passport, projects, evidence, outcomes });
const timeline = new MissionTimelineManager({ multilab, labContext, evidence, multiEvents, branches, consequences, passport, projects });
const reports = new MultiLabReportBuilder({ multilab, timeline, passport, projects, outcomes, labContext, evidence, consequences, branches, multiEvents });
const inspection = new MultiLabInspectionManager({ storage, events, multilab });
const history = new MultiLabSessionHistory({ multilab, passport, projects, timeline, reports, outcomes, events, inspection });
const sessionBundles = new MultiLabSessionBundleManager({
  storage,
  events,
  multilab,
  passport,
  projects,
  labContext,
  evidence,
  consequences,
  branches,
  multiEvents,
  reports,
  inspection,
  appVersion:APP_VERSION
});
const comparisons = new MultiLabComparisonManager({ history, reports, outcomes, labContext, evidence, multiEvents, branches, consequences });
const portfolio = new PortfolioExporter({ evidence, labContext, projects, logger, passport, multilab, consequences, multiEvents });

const context = {
  events,
  storage,
  ui,
  logger,
  quality,
  performance,
  graphics,
  assets,
  appVersion:APP_VERSION,
  deviceProfile,
  benchmarkBundle,
  graphicsTelemetry,
  graphicsBudgets,
  graphicsBudgetStore,
  graphicsBenchmark,
  graphicsVisualBaselines,
  graphicsRegressionReport,
  graphicsOptimizationQueue,
  guidedBenchmark,
  three,
  panorama360,
  audio,
  pbr,
  environmentLighting,
  spatialAudio,
  immersiveBridge,
  runtimeQuality,
  scenarios,
  evidence,
  curriculumProgress,
  labContext,
  passport,
  consequences,
  multiEvents,
  branches,
  outcomes,
  timeline,
  reports,
  inspection,
  sessionBundles,
  history,
  comparisons,
  projects,
  portfolio,
  journey,
  multilab,
  router: null,
  modules: null,

  settings: {
    get: (name, fallback) => storage.get(`settings.${name}`, fallback),
    set: (name, value) => storage.set(`settings.${name}`, value)
  }
};

const router = new Router({ events });
const loader = new ModuleLoader({ logger });
const modules = new ModuleRegistry({ loader, events, logger, context });

context.router = router;
context.modules = modules;

if (debug) window.BioLab = context;

createGuidedBenchmarkBanner({
  manager:guidedBenchmark,
  events
});

startApp(context).catch(error => {
  logger.error("Falha fatal de inicialização", error);
  ui.error("Falha ao iniciar", error?.message || "Erro desconhecido");
});
