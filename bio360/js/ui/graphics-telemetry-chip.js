export function renderGraphicsTelemetryChip({
  renderer,
  scene,
  fps=0
}={}){
  const info=renderer?.info;
  const render=info?.render||{};
  const memory=info?.memory||{};
  let objects=0;
  scene?.traverse?.(()=>objects++);

  return[
    `${Math.round(Number(fps||0))||"—"} FPS`,
    `${Number(render.calls||0)} calls`,
    `${compact(render.triangles||0)} tri`,
    `${Number(memory.textures||0)} tex`,
    `${objects} obj`
  ].join(" • ");
}

function compact(value){
  const n=Number(value||0);
  if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`;
  if(n>=1000)return`${Math.round(n/1000)}k`;
  return String(n);
}
