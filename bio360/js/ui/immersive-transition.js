export function createImmersiveTransition({root,overlay,stage,onBeforeNavigate=()=>{}}={}){
  let navigating=false;
  const navigate=(route,{title="Entrando no laboratório 3D",subtitle="Preparando a experiência..."}={})=>{
    if(!route||navigating)return;navigating=true;
    overlay?.querySelector("[data-transition-title]")?.replaceChildren(document.createTextNode(title));
    overlay?.querySelector("[data-transition-subtitle]")?.replaceChildren(document.createTextNode(subtitle));
    root?.classList.add("immersive-transitioning");overlay?.classList.add("active");overlay?.setAttribute("aria-hidden","false");stage?.classList.add("transition-out");
    try{onBeforeNavigate();}catch{} setTimeout(()=>{location.hash=`#${route.startsWith("/")?route:`/${route}`}`;},520);
  };
  return{navigate,reset:()=>{navigating=false;root?.classList.remove("immersive-transitioning");overlay?.classList.remove("active");stage?.classList.remove("transition-out");},isNavigating:()=>navigating};
}
