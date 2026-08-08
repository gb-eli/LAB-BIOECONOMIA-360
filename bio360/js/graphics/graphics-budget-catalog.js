const PROFILE_MULTIPLIERS={
  eco:{
    minFps:30,
    p95FrameMs:38,
    calls:.68,
    triangles:.48,
    textures:.70,
    geometries:.72,
    objects:.72
  },
  balanced:{
    minFps:40,
    p95FrameMs:30,
    calls:.84,
    triangles:.70,
    textures:.84,
    geometries:.86,
    objects:.86
  },
  high:{
    minFps:48,
    p95FrameMs:24,
    calls:1,
    triangles:.90,
    textures:1,
    geometries:1,
    objects:1
  },
  ultra:{
    minFps:50,
    p95FrameMs:23,
    calls:1.14,
    triangles:1.12,
    textures:1.12,
    geometries:1.12,
    objects:1.12
  }
};

const DEFAULT_BASE={
  maxCalls:170,
  maxTriangles:520000,
  maxTextures:48,
  maxGeometries:250,
  maxObjects:480
};

const SCENES={
  "territory-canvas":{
    label:"Território Bioeconômico",
    group:"território",
    base:{maxCalls:155,maxTriangles:430000,maxTextures:46,maxGeometries:220,maxObjects:460}
  },
  "agro-canvas":{
    label:"Agroindústria",
    group:"industrial",
    base:{maxCalls:185,maxTriangles:600000,maxTextures:54,maxGeometries:280,maxObjects:520}
  },
  "animal-canvas":{
    label:"Produção Animal",
    group:"produção",
    base:{maxCalls:175,maxTriangles:560000,maxTextures:50,maxGeometries:265,maxObjects:540}
  },
  "circular-canvas":{
    label:"Economia Circular",
    group:"circularidade",
    base:{maxCalls:180,maxTriangles:510000,maxTextures:48,maxGeometries:245,maxObjects:500}
  },
  "tour-canvas":{
    label:"Turismo Sustentável",
    group:"turismo",
    base:{maxCalls:160,maxTriangles:450000,maxTextures:46,maxGeometries:230,maxObjects:490}
  },
  "chain-canvas":{
    label:"Cadeia Produtiva Integrada",
    group:"cadeia",
    base:{maxCalls:175,maxTriangles:540000,maxTextures:52,maxGeometries:270,maxObjects:500}
  },
  "marketing-canvas":{
    label:"Marketing e Consumo Sustentável",
    group:"mercado",
    base:{maxCalls:130,maxTriangles:320000,maxTextures:40,maxGeometries:190,maxObjects:360}
  },
  "assoc-canvas":{
    label:"Associativismo e Cooperativismo",
    group:"governança",
    base:{maxCalls:120,maxTriangles:280000,maxTextures:38,maxGeometries:175,maxObjects:340}
  }
};

export class GraphicsBudgetCatalog{
  constructor(){
    this.scenes=SCENES;
  }

  sceneIds(){
    return Object.keys(this.scenes);
  }

  profiles(){
    return Object.keys(PROFILE_MULTIPLIERS);
  }

  scene(sceneId){
    return this.scenes[sceneId]||{
      label:sceneLabel(sceneId),
      group:"outros",
      base:DEFAULT_BASE
    };
  }

  budget(sceneId,profileId="balanced"){
    const scene=this.scene(sceneId);
    const p=PROFILE_MULTIPLIERS[profileId]||PROFILE_MULTIPLIERS.balanced;
    const base={...DEFAULT_BASE,...(scene.base||{})};

    return{
      sceneId,
      sceneLabel:scene.label,
      group:scene.group,
      profileId,
      minFps:p.minFps,
      maxP95FrameMs:p.p95FrameMs,
      maxCalls:Math.round(base.maxCalls*p.calls),
      maxTriangles:Math.round(base.maxTriangles*p.triangles),
      maxTextures:Math.round(base.maxTextures*p.textures),
      maxGeometries:Math.round(base.maxGeometries*p.geometries),
      maxObjects:Math.round(base.maxObjects*p.objects)
    };
  }

  matrix(){
    return this.sceneIds().flatMap(sceneId=>
      this.profiles().map(profileId=>this.budget(sceneId,profileId))
    );
  }
}

function sceneLabel(id=""){
  return String(id)
    .replace(/-canvas$/,"")
    .replace(/-/g," ")
    .replace(/\b\w/g,m=>m.toUpperCase());
}
