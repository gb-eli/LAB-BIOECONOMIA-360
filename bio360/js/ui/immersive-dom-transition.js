export function navigateWithImmersiveFade({route,title="Abrindo visão 360",subtitle="Transferindo o ponto de vista...",onBeforeNavigate=()=>{}}={}){
  if(!route)return;const o=document.createElement("div");o.className="immersive-dom-transition";
  o.innerHTML=`<div class="immersive-dom-transition__core"><div class="immersive-dom-transition__orbit"></div><span>3D → 360</span><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></div>`;
  document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add("active"));try{onBeforeNavigate();}catch{}
  setTimeout(()=>{location.hash=`#${route.startsWith("/")?route:`/${route}`}`;setTimeout(()=>o.remove(),250);},460);
}
function esc(v=""){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
