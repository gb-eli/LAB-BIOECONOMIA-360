export function createAnimalInstallationKit(THREE){
  const create=(scene,{profile}={})=>{
    const group=new THREE.Group();group.name="animal-installations-g5";scene.add(group);
    const wood=new THREE.MeshStandardMaterial({color:0x8e704f,roughness:.91}),steel=new THREE.MeshStandardMaterial({color:0x879b98,roughness:.56,metalness:.35}),concrete=new THREE.MeshStandardMaterial({color:0x8d9893,roughness:.90}),green=new THREE.MeshStandardMaterial({color:0x5f936c,roughness:.88}),blue=new THREE.MeshPhysicalMaterial({color:0x5ba7b7,roughness:.18,transparent:true,opacity:.72});
    const modes=new Map();
    const bovine=new THREE.Group(),shade=new THREE.Mesh(new THREE.BoxGeometry(4.6,.14,2.3),green);shade.position.set(0,2.25,0);bovine.add(shade);
    for(const x of [-2.1,2.1])for(const z of [-.95,.95]){const post=new THREE.Mesh(new THREE.BoxGeometry(.12,2.3,.12),wood);post.position.set(x,1.15,z);bovine.add(post);}
    const tr=new THREE.Mesh(new THREE.BoxGeometry(2.8,.48,.72),concrete);tr.position.set(0,.27,1.55);bovine.add(tr);bovine.position.set(-1.5,0,-3.8);group.add(bovine);modes.set("bovinos",bovine);
    const poultry=new THREE.Group(),house=new THREE.Mesh(new THREE.BoxGeometry(5.2,1.65,2.4),new THREE.MeshStandardMaterial({color:0xb6aa8a,roughness:.93}));house.position.y=.83;poultry.add(house);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(5.5,.16,2.8),green);roof.position.y=1.75;poultry.add(roof);for(let i=0;i<(profile?.rank>=2?8:4);i++){const vent=new THREE.Mesh(new THREE.BoxGeometry(.38,.28,.06),steel);vent.position.set(-2.1+i*(4.2/Math.max(1,(profile?.rank>=2?8:4)-1)),1.1,-1.23);poultry.add(vent);}
    poultry.position.set(-1.4,0,-3.5);group.add(poultry);modes.set("aves",poultry);
    const fish=new THREE.Group();for(const x of [-1.3,1.3]){const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.56,28),steel);tank.position.set(x,.28,0);fish.add(tank);const w=new THREE.Mesh(new THREE.CylinderGeometry(.94,.94,.08,28),blue.clone());w.position.set(x,.59,0);fish.add(w);const aer=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.72,12),green);aer.position.set(x,.95,0);fish.add(aer);}
    fish.position.set(-.8,0,-3.0);group.add(fish);modes.set("peixes",fish);
    const setSpecies=s=>{const k=normalize(s);for(const [key,obj] of modes)obj.visible=key===k;return k;};setSpecies("bovinos");
    return{group,modes,setSpecies,update:(t,s)=>{const k=setSpecies(s);if(k==="peixes")modes.get("peixes").rotation.y=Math.sin(t*.28)*.012;if(k==="aves")modes.get("aves").position.y=Math.sin(t*.9)*.006;}};
  };return{create};
}
function normalize(v){v=String(v||"").toLowerCase();if(v.includes("ave")||v.includes("frango"))return"aves";if(v.includes("peix")||v.includes("pisc")||v.includes("tilap"))return"peixes";return"bovinos";}
