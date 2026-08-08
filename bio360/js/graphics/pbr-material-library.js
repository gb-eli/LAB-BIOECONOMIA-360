const SETS = {
  soil:{
    base:"pbr-soil-basecolor",
    normal:"pbr-soil-normal",
    roughness:"pbr-soil-roughness",
    roughnessValue:.92,
    metalness:0
  },
  concrete:{
    base:"pbr-concrete-basecolor",
    normal:"pbr-concrete-normal",
    roughness:"pbr-concrete-roughness",
    roughnessValue:.82,
    metalness:0
  },
  metal:{
    base:"pbr-metal-basecolor",
    normal:"pbr-metal-normal",
    roughness:"pbr-metal-roughness",
    roughnessValue:.48,
    metalness:.62
  },
  wood:{base:"pbr-wood-basecolor",normal:"pbr-wood-normal",roughness:"pbr-wood-roughness",roughnessValue:.84,metalness:0},
  vegetation:{base:"pbr-vegetation-basecolor",normal:"pbr-vegetation-normal",roughness:"pbr-vegetation-roughness",roughnessValue:.92,metalness:0},
  water:{base:"pbr-water-basecolor",normal:"pbr-water-normal",roughness:"pbr-water-roughness",roughnessValue:.22,metalness:0,physical:true}
};

export class PBRMaterialLibrary {
  constructor({ three, quality, logger }) {
    this.three = three;
    this.quality = quality;
    this.logger = logger;
  }

  async create(scope,setId,{
    repeat=[4,4],
    color=0xffffff,
    roughness=null,
    metalness=null,
    normalScale=.65
  }={}) {
    const def=SETS[setId];
    if(!def) throw new Error(`Conjunto PBR não registrado: ${setId}`);

    const {THREE}=await this.three.modules();

    const [baseSource,normalSource,roughSource]=await Promise.all([
      scope.loadAsset(def.base),
      scope.loadAsset(def.normal),
      scope.loadAsset(def.roughness)
    ]);

    const map=cloneTexture(THREE,baseSource,repeat,true,this.quality.current.rank);
    const normalMap=cloneTexture(THREE,normalSource,repeat,false,this.quality.current.rank);
    const roughnessMap=cloneTexture(THREE,roughSource,repeat,false,this.quality.current.rank);

    const material=def.physical
      ? new THREE.MeshPhysicalMaterial({color,map,normalMap,roughnessMap,roughness:roughness ?? def.roughnessValue,metalness:metalness ?? def.metalness,transparent:true,opacity:.86,clearcoat:.28,clearcoatRoughness:.18,depthWrite:true})
      : new THREE.MeshStandardMaterial({color,map,normalMap,roughnessMap,roughness:roughness ?? def.roughnessValue,metalness:metalness ?? def.metalness});

    material.normalScale.set(normalScale,normalScale);
    material.userData.pbrSet=setId;
    return material;
  }
}

function cloneTexture(THREE,source,repeat,srgb,rank){
  const texture=source.clone();
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(Number(repeat[0]||1),Number(repeat[1]||1));
  texture.colorSpace=srgb?THREE.SRGBColorSpace:(THREE.NoColorSpace||"");
  texture.anisotropy=rank>=3?8:rank>=2?4:2;
  texture.needsUpdate=true;
  return texture;
}
