export class EnvironmentLightingManager {
  constructor({ three, quality, logger }) {
    this.three = three;
    this.quality = quality;
    this.logger = logger;
  }

  async apply(scene,renderer,scope,assetId,{
    intensity=1,
    background=false
  }={}) {
    const {THREE}=await this.three.modules();
    const source=await scope.loadAsset(assetId);

    source.mapping=THREE.EquirectangularReflectionMapping;
    source.colorSpace=THREE.SRGBColorSpace;
    source.needsUpdate=true;

    const pmrem=new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const target=pmrem.fromEquirectangular(source);
    const previousEnvironment=scene.environment;
    const previousBackground=scene.background;

    scene.environment=target.texture;
    if("environmentIntensity" in scene){
      scene.environmentIntensity=Number(intensity);
    }

    if(background){
      scene.background=source;
      scene.backgroundBlurriness=.18;
      if("backgroundIntensity" in scene) scene.backgroundIntensity=.82;
    }

    pmrem.dispose();

    return {
      texture:target.texture,
      dispose(){
        if(scene.environment===target.texture)scene.environment=previousEnvironment;
        if(background&&scene.background===source)scene.background=previousBackground;
        target.dispose();
      }
    };
  }
}
