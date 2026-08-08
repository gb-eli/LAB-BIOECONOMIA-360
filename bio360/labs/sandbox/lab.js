let raf=0, resizeObserver=null, canvas=null, ctx=null, running=false;
let startTime=0, last=0, frames=0, fps=0, manifestRef=null;
let toggleHandler=null, resetHandler=null;

const vertices=[
  [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
  [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
];
const edges=[
  [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7]
];

export default {
  id:"lab-sandbox",
  async mount(context, manifest) {
    manifestRef=manifest;
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <span class="eyebrow">Laboratório técnico</span>
          <h1>${manifest.name}</h1>
          <p class="sandbox-note">Este Sandbox usa Canvas puro para testar a arquitetura modular antes de Three.js, GLB, KTX2 e assets pesados.</p>
        </header>
        <div class="sandbox-stage" id="stage">
          <canvas id="sandbox-canvas" aria-label="Cubo técnico animado"></canvas>
          <div id="sandbox-hud" class="sandbox-hud">FPS: --<br>Loop: parado</div>
        </div>
        <div class="module-actions">
          <button id="toggle-loop" class="button primary" type="button">Pausar</button>
          <button id="reset-loop" class="button" type="button">Reiniciar tempo</button>
        </div>
      </div>`);
    canvas=document.querySelector("#sandbox-canvas");
    ctx=canvas.getContext("2d");
    const stage=document.querySelector("#stage");
    resizeObserver=new ResizeObserver(()=>resize());
    resizeObserver.observe(stage);

    toggleHandler=()=>toggle();
    resetHandler=()=>resetTime();
    document.querySelector("#toggle-loop").addEventListener("click",toggleHandler);
    document.querySelector("#reset-loop").addEventListener("click",resetHandler);
    resize();
  },
  async activate() {
    running=true; startTime=performance.now(); last=startTime; frames=0; fps=0; loop(startTime);
  },
  async deactivate() {
    running=false; cancelAnimationFrame(raf); raf=0;
  },
  async unmount() {
    running=false; cancelAnimationFrame(raf);
    resizeObserver?.disconnect(); resizeObserver=null;
    const t=document.querySelector("#toggle-loop"), r=document.querySelector("#reset-loop");
    if(t&&toggleHandler)t.removeEventListener("click",toggleHandler);
    if(r&&resetHandler)r.removeEventListener("click",resetHandler);
    toggleHandler=null; resetHandler=null; canvas=null; ctx=null; manifestRef=null;
  }
};

function resize(){
  if(!canvas||!ctx)return;
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.max(1,Math.floor(rect.width*dpr));
  canvas.height=Math.max(1,Math.floor(rect.height*dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function loop(now){
  if(!running||!ctx||!canvas)return;
  raf=requestAnimationFrame(loop);
  frames++;
  if(now-last>=500){fps=Math.round((frames*1000)/(now-last));frames=0;last=now;}
  draw(now);
  const hud=document.querySelector("#sandbox-hud");
  if(hud)hud.innerHTML=`FPS: ${fps||"--"}<br>Loop: ativo<br>Pacote: ${manifestRef?.version||""}`;
}
function draw(now){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  const t=(now-startTime)*0.001;
  const cosY=Math.cos(t*.75),sinY=Math.sin(t*.75),cosX=Math.cos(t*.42),sinX=Math.sin(t*.42);
  const projected=vertices.map(([x,y,z])=>{
    const x1=x*cosY-z*sinY, z1=x*sinY+z*cosY;
    const y1=y*cosX-z1*sinX, z2=y*sinX+z1*cosX;
    const distance=4.2, scale=Math.min(w,h)*.22/(z2+distance);
    return [w/2+x1*scale*distance,h/2+y1*scale*distance];
  });
  ctx.lineWidth=2;ctx.strokeStyle="#57d6a3";ctx.shadowColor="rgba(87,214,163,.45)";ctx.shadowBlur=10;
  for(const[a,b]of edges){ctx.beginPath();ctx.moveTo(...projected[a]);ctx.lineTo(...projected[b]);ctx.stroke();}
  ctx.shadowBlur=0;ctx.fillStyle="#eafff6";
  projected.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
}
function toggle(){
  running=!running;
  const btn=document.querySelector("#toggle-loop"),hud=document.querySelector("#sandbox-hud");
  if(running){last=performance.now();loop(last);if(btn)btn.textContent="Pausar";}
  else{cancelAnimationFrame(raf);raf=0;if(btn)btn.textContent="Retomar";if(hud)hud.innerHTML=`FPS: ${fps||"--"}<br>Loop: pausado`;}
}
function resetTime(){startTime=performance.now();}
