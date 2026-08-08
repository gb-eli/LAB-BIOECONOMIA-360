export class AmbientAudioManager {
  constructor({ assets, storage, events, logger }) {
    this.assets=assets;
    this.storage=storage;
    this.events=events;
    this.logger=logger;
    this.channels=new Map();
    this.masterVolume=Number(storage.get("settings.ambientVolume",.38));
  }

  createChannel({ id, assetId, volume=1, loop=true }) {
    if(!id) throw new Error("Canal de áudio sem id.");
    const resolved=this.assets.resolveAsset(assetId);
    if(!resolved) throw new Error(`Áudio não registrado: ${assetId}`);

    this.disposeChannel(id);

    const audio=new Audio(resolved.url);
    audio.loop=loop;
    audio.preload="metadata";
    audio.crossOrigin="anonymous";
    audio.volume=clamp(this.masterVolume*volume,0,1);

    let playing=false;

    const channel={
      id,
      assetId,
      audio,
      async play(){
        try{
          await audio.play();
          playing=true;
          return true;
        }catch(error){
          playing=false;
          throw error;
        }
      },
      pause(){
        audio.pause();
        playing=false;
      },
      stop(){
        audio.pause();
        audio.currentTime=0;
        playing=false;
      },
      isPlaying(){return playing&&!audio.paused;},
      setVolume:value=>{
        volume=clamp(Number(value||0),0,1);
        audio.volume=clamp(this.masterVolume*volume,0,1);
      },
      dispose:()=>{
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        playing=false;
      }
    };

    this.channels.set(id,channel);
    this.events.emit("audio:channel-created",{id,assetId});
    return channel;
  }

  setMasterVolume(value){
    this.masterVolume=clamp(Number(value||0),0,1);
    this.storage.set("settings.ambientVolume",this.masterVolume);
    for(const channel of this.channels.values()){
      channel.audio.volume=clamp(this.masterVolume,0,1);
    }
    this.events.emit("audio:volume-changed",{value:this.masterVolume});
  }

  disposeChannel(id){
    const current=this.channels.get(id);
    if(!current)return;
    current.dispose();
    this.channels.delete(id);
  }

  dispose(){
    for(const id of [...this.channels.keys()])this.disposeChannel(id);
  }
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
