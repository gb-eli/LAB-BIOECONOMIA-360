export function createActionFeedbackG13({
  THREE,
  context,
  camera,
  moduleId,
  definitions={}
}){
  const state=new Map();
  const history=[];
  let disposed=false;

  for(const [id,definition] of Object.entries(definitions)){
    state.set(id,{
      active:false,
      label:definition.label||id,
      stateOn:definition.stateOn||"Ativo",
      stateOff:definition.stateOff||"Inativo",
      category:definition.category||"Estado operacional",
      position:definition.position||[0,0,0],
      cue:definition.cue||{}
    });
  }

  const off=context.events.on("immersive:environment-action",event=>{
    if(disposed||event.moduleId!==moduleId)return;
    const current=state.get(event.actionId);
    if(!current)return;

    current.active=Boolean(event.active);
    current.updatedAt=event.at||new Date().toISOString();

    history.unshift({
      actionId:event.actionId,
      active:current.active,
      at:current.updatedAt
    });
    if(history.length>30)history.length=30;

    if(current.active){
      const position=toVector(THREE,current.position);
      context.spatialAudio.playCue({
        camera,
        position,
        id:`${moduleId}:${event.actionId}:on`,
        ...current.cue
      }).catch(error=>{
        context.logger?.warn?.("Feedback sonoro G13 indisponível.",error);
      });
    }else{
      const offCue=current.cue.off||null;
      if(offCue){
        const position=toVector(THREE,current.position);
        context.spatialAudio.playCue({
          camera,
          position,
          id:`${moduleId}:${event.actionId}:off`,
          ...offCue
        }).catch(()=>{});
      }
    }

    context.events.emit("immersive:operational-state",{
      moduleId,
      actionId:event.actionId,
      active:current.active,
      label:current.label,
      text:current.active?current.stateOn:current.stateOff,
      at:current.updatedAt
    });
  });

  const describe=id=>{
    const current=state.get(id);
    if(!current)return null;
    return{
      actionId:id,
      active:current.active,
      label:current.label,
      status:current.active?current.stateOn:current.stateOff,
      category:current.category,
      updatedAt:current.updatedAt||null
    };
  };

  const active=()=>[...state.entries()]
    .filter(([,item])=>item.active)
    .map(([id,item])=>({
      id,
      label:item.label,
      status:item.stateOn
    }));

  const snapshot=()=>({
    moduleId,
    active:active(),
    states:[...state.entries()].map(([id,item])=>({
      id,
      active:item.active,
      label:item.label,
      status:item.active?item.stateOn:item.stateOff
    })),
    history:[...history]
  });

  const dispose=()=>{
    if(disposed)return;
    disposed=true;
    off?.();
    state.clear();
    history.length=0;
  };

  return{describe,active,snapshot,dispose};
}

function toVector(THREE,value){
  if(value?.clone)return value;
  if(typeof value==="function"){
    const resolved=value();
    return resolved?.clone?resolved:new THREE.Vector3(
      Number(resolved?.x||resolved?.[0]||0),
      Number(resolved?.y||resolved?.[1]||0),
      Number(resolved?.z||resolved?.[2]||0)
    );
  }
  return new THREE.Vector3(
    Number(value?.x||value?.[0]||0),
    Number(value?.y||value?.[1]||0),
    Number(value?.z||value?.[2]||0)
  );
}
