export function createBiomassEffectsG5(THREE){
  const attach=(scene,{nodes,profile}={})=>{const group=new THREE.Group();scene.add(group),count=profile?.rank>=2?42:20,geo=new THREE.DodecahedronGeometry(.075,0),mat=new THREE.MeshStandardMaterial({color:0x8f794c,roughness:.96}),pieces=[];
    for(let i=0;i<count;i++){const m=new THREE.Mesh(geo,mat);group.add(m);pieces.push(m);}const bio=nodes.bio.pos,comp=nodes.compost.pos;
    return{update:(t,c,budget=1)=>{const org=Math.min(1,(c?.organic||0)/100),active=["biodigestor","compostagem","integrada"].includes(c?.strategy),b=Math.max(.1,Math.min(1,Number(budget||1))),n=Math.round(count*org*(active?.9:.2)*b);pieces.forEach((m,i)=>{m.visible=i<n;if(!m.visible)return;const target=c?.strategy==="compostagem"?comp:bio,ph=(t*.09+i/Math.max(1,n))%1;m.position.set(-3+(target[0]+3)*ph,.18+Math.sin(ph*Math.PI)*.55,.15+(target[2]-.15)*ph+Math.sin(i*1.7+ph*6.28)*.12);m.rotation.set(t*.7+i,t*.45+i*.2,t*.28);});}};};return{attach};
}
