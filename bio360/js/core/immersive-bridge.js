export class ImmersiveBridge {
  constructor({storage,events}){this.storage=storage;this.events=events;this.key="immersive.bridge.handoff";}
  to360({sceneId,hotspotId=null,yaw=0,pitch=0,fov=72,sourceRoute=null,sourceLabel=null}){
    const payload={type:"3d-to-360",sceneId,hotspotId,yaw:Number(yaw||0),pitch:Number(pitch||0),fov:Number(fov||72),sourceRoute,sourceLabel,createdAt:new Date().toISOString()};
    this.storage.set(this.key,payload);this.events.emit("immersive:handoff-created",payload);return payload;
  }
  consume(){const p=this.storage.get(this.key,null);if(!p)return null;if(this.storage.remove)this.storage.remove(this.key);else this.storage.set(this.key,null);this.events.emit("immersive:handoff-consumed",p);return p;}
  peek(){return this.storage.get(this.key,null);}
}
