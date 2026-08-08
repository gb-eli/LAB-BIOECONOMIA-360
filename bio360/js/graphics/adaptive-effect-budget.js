export function createAdaptiveEffectBudget({
  min=.25,
  max=1,
  initial=1
}={}){
  let factor=clamp(initial,min,max);
  let lastChange=0;

  const update=(metrics,quality,now=performance.now())=>{
    const fps=Number(metrics?.fps||0);
    const rank=Number(quality?.rank??1);
    const profileCap=[.48,.72,.92,1][Math.max(0,Math.min(3,rank))]||.72;

    if(fps>0 && now-lastChange>900){
      if(fps<27){
        factor=Math.max(min,factor-.16);
        lastChange=now;
      }else if(fps<36){
        factor=Math.max(min,factor-.08);
        lastChange=now;
      }else if(fps>54){
        factor=Math.min(max,factor+.07);
        lastChange=now;
      }else if(fps>46){
        factor=Math.min(max,factor+.035);
        lastChange=now;
      }
    }

    factor=Math.min(factor,profileCap);
    return factor;
  };

  return{
    update,
    value:()=>factor,
    reset:value=>{factor=clamp(Number(value||initial),min,max);}
  };
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
