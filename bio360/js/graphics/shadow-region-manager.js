export class ShadowRegionManager {
  constructor({
    light,
    camera=null,
    minSize=7,
    maxSize=22,
    near=.5,
    far=55,
    updateInterval=420
  }) {
    this.light=light;
    this.camera=camera;
    this.minSize=minSize;
    this.maxSize=maxSize;
    this.near=near;
    this.far=far;
    this.updateInterval=updateInterval;
    this.lastUpdate=0;
    this.lastCenter=null;
    this.target=light?.target||null;
  }

  update({
    center=null,
    runtimeScale=1,
    now=performance.now()
  }={}) {
    if(!this.light?.shadow || now-this.lastUpdate<this.updateInterval){
      return this.snapshot();
    }

    const scale=Math.max(.35,Math.min(1,Number(runtimeScale||1)));
    const resolved=center||this.#cameraCenter();
    if(!resolved)return this.snapshot();

    const size=this.minSize+(this.maxSize-this.minSize)*(.42+scale*.58);
    const half=size/2;

    this.light.shadow.camera.left=-half;
    this.light.shadow.camera.right=half;
    this.light.shadow.camera.top=half;
    this.light.shadow.camera.bottom=-half;
    this.light.shadow.camera.near=this.near;
    this.light.shadow.camera.far=this.far;
    this.light.shadow.camera.updateProjectionMatrix?.();

    if(this.target){
      this.target.position.copy?.(resolved);
      this.target.updateMatrixWorld?.();
    }

    // Keep the light direction but move its target region.
    const offset=this.light.position.clone().sub(this.target?.position||resolved);
    if(offset.lengthSq()<.01)offset.set(-6,12,8);
    this.light.position.copy(resolved).add(offset);

    this.lastCenter=resolved.clone?.()||resolved;
    this.lastUpdate=now;

    return this.snapshot();
  }

  #cameraCenter(){
    if(!this.camera?.getWorldDirection)return null;
    const dir=this.camera.position.clone();
    this.camera.getWorldDirection(dir);
    return this.camera.position.clone().add(dir.multiplyScalar(7));
  }

  snapshot(){
    const cam=this.light?.shadow?.camera;
    return{
      size:cam?Math.abs(Number(cam.right||0)-Number(cam.left||0)):0,
      center:this.lastCenter
    };
  }
}
