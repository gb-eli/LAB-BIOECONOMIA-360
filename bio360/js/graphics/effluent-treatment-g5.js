export function createEffluentTreatmentG5(THREE){
  const attach=(scene,{profile,position=[2,0,5.5]}={})=>{
    const group=new THREE.Group();group.position.set(...position);scene.add(group);const concrete=new THREE.MeshStandardMaterial({color:0x7f8e88,roughness:.88}),stages=[];
    for(let i=0;i<3;i++){const g=new THREE.Group(),tank=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.46,profile?.rank>=2?28:16),concrete);tank.position.y=.23;g.add(tank);const water=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.08,24),new THREE.MeshPhysicalMaterial({color:[0x7d8168,0x4c939a,0x5bb6b1][i],transparent:true,opacity:.72,roughness:.25}));water.position.y=.50;g.add(water);g.position.x=(i-1)*1.75;group.add(g);stages.push({g,water});}
    const bubbles=[];for(let i=0;i<(profile?.rank>=2?18:9);i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.035,7,5),new THREE.MeshBasicMaterial({color:0xc8f5ed,transparent:true,opacity:.58}));stages[1].g.add(b);bubbles.push(b);}
    return{group,update:(t,p=0)=>{stages.forEach((s,i)=>{s.water.position.y=.50+Math.sin(t*.7+i)*.008;s.water.scale.y=.88+Math.min(1,p/100)*.15;});bubbles.forEach((b,i)=>{const ph=(t*.18+i/bubbles.length)%1;b.position.set(-.35+((i*37)%100)/100*.7,.12+ph*.78,-.35+((i*61)%100)/100*.7);b.scale.setScalar(.55+ph*.8);b.material.opacity=.52*(1-ph);});}};
  };return{attach};
}
