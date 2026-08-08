export function createSceneComplexityBudget({
  profile,
  base={
    repeated:1,
    decorations:1,
    visitors:1,
    accents:1
  }
}={}){
  let runtimeScale=1;

  const setRuntime=runtime=>{
    runtimeScale=Math.max(.30,Math.min(1,Number(runtime?.scale??runtime??1)));
    return snapshot();
  };

  const factor=(kind="repeated")=>{
    const rank=Number(profile?.rank??1);
    const profileFactor=[.52,.74,.92,1][Math.max(0,Math.min(3,rank))]||.74;
    const kindBase=Number(base[kind]??1);
    const runtimeFactor=.38+runtimeScale*.62;
    return Math.max(.20,Math.min(1,profileFactor*runtimeFactor*kindBase));
  };

  const limit=(requested,kind="repeated",min=1)=>{
    return Math.max(
      min,
      Math.min(
        Math.round(Number(requested||0)),
        Math.round(Number(requested||0)*factor(kind))
      )
    );
  };

  const snapshot=()=>({
    runtimeScale,
    repeated:factor("repeated"),
    decorations:factor("decorations"),
    visitors:factor("visitors"),
    accents:factor("accents")
  });

  return{setRuntime,factor,limit,snapshot};
}
