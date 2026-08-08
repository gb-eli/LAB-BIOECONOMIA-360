export function createIndustrialAnimationKit(THREE){
  const attach=(scene,stationMeshes,{profile}={})=>{
    const group=new THREE.Group();
    group.name="industrial-animation-g5";
    scene.add(group);

    const packages=[];
    const beltMat=new THREE.MeshStandardMaterial({color:0x28312f,roughness:.68,metalness:.18});
    const belt=new THREE.Mesh(new THREE.BoxGeometry(3.2,.12,.62),beltMat);
    belt.position.set(0,.58,0);
    stationMeshes.get("embalagem")?.add(belt);

    const pkgGeo=new THREE.BoxGeometry(.22,.20,.20);
    const pkgMat=new THREE.MeshStandardMaterial({color:0xc99f62,roughness:.78});
    for(let i=0;i<(profile?.rank>=2?7:4);i++){
      const pkg=new THREE.Mesh(pkgGeo,pkgMat);
      pkg.position.set(-1.25+i*.42,.77,0);
      stationMeshes.get("embalagem")?.add(pkg);
      packages.push(pkg);
    }

    const liquidDrops=[];
    const dropGeo=new THREE.SphereGeometry(.045,8,6);
    const dropMat=new THREE.MeshPhysicalMaterial({
      color:0x6ec5d5,roughness:.16,transparent:true,opacity:.72
    });
    for(let i=0;i<(profile?.rank>=2?12:6);i++){
      const drop=new THREE.Mesh(dropGeo,dropMat);
      stationMeshes.get("processo")?.add(drop);
      liquidDrops.push(drop);
    }

    const valve=new THREE.Group();
    const valveRing=new THREE.Mesh(
      new THREE.TorusGeometry(.24,.035,8,22),
      new THREE.MeshStandardMaterial({color:0xc9a457,metalness:.55,roughness:.42})
    );
    const spokeMat=new THREE.MeshStandardMaterial({color:0x8a7143,metalness:.48,roughness:.45});
    for(let i=0;i<4;i++){
      const spoke=new THREE.Mesh(new THREE.BoxGeometry(.38,.035,.035),spokeMat);
      spoke.rotation.z=i*Math.PI/4;
      valve.add(spoke);
    }
    valve.add(valveRing);
    valve.rotation.x=Math.PI/2;
    valve.position.set(.75,1.38,.05);
    stationMeshes.get("higiene")?.add(valve);

    const fan=new THREE.Group();
    const hub=new THREE.Mesh(
      new THREE.CylinderGeometry(.09,.09,.12,12),
      new THREE.MeshStandardMaterial({color:0x8ca2a6,metalness:.52,roughness:.45})
    );
    hub.rotation.x=Math.PI/2;
    fan.add(hub);
    for(let i=0;i<4;i++){
      const blade=new THREE.Mesh(
        new THREE.BoxGeometry(.48,.07,.025),
        new THREE.MeshStandardMaterial({color:0x7d9397,metalness:.38,roughness:.5})
      );
      blade.position.x=.24;
      blade.rotation.z=i*Math.PI/2;
      fan.add(blade);
    }
    fan.position.set(0,1.35,-.78);
    stationMeshes.get("armazenamento")?.add(fan);

    const washJets=[];
    const jetMat=new THREE.MeshPhysicalMaterial({color:0x75c8da,transparent:true,opacity:.52,roughness:.12});
    for(let i=0;i<(profile?.rank>=2?8:4);i++){const jet=new THREE.Mesh(new THREE.CylinderGeometry(.018,.035,.65,7),jetMat);jet.position.set(-.48+i*.14,1.35,-.05);jet.rotation.z=(i%2?-.18:.18);stationMeshes.get("higiene")?.add(jet);washJets.push(jet);}
    const mixer=new THREE.Group();
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.9,10),new THREE.MeshStandardMaterial({color:0x899a97,metalness:.55,roughness:.4}));shaft.position.y=1.1;mixer.add(shaft);
    for(let i=0;i<3;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.58,.045,.12),new THREE.MeshStandardMaterial({color:0x8ba09c,metalness:.48,roughness:.42}));blade.position.y=.72;blade.rotation.y=i*Math.PI/3;mixer.add(blade);}stationMeshes.get("processo")?.add(mixer);
    const processLiquid=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.32,24),new THREE.MeshPhysicalMaterial({color:0x6bb9b1,transparent:true,opacity:.63,roughness:.18,clearcoat:.22}));processLiquid.position.set(0,.48,0);stationMeshes.get("processo")?.add(processLiquid);
    const scanner=new THREE.Mesh(new THREE.BoxGeometry(.035,.62,.72),new THREE.MeshBasicMaterial({color:0x6de0b0,transparent:true,opacity:.18,depthWrite:false}));scanner.position.set(.72,1.02,0);stationMeshes.get("embalagem")?.add(scanner);
    const coldMist=[];const coldMat=new THREE.MeshBasicMaterial({color:0xc9f2ef,transparent:true,opacity:.22,depthWrite:false});
    for(let i=0;i<(profile?.rank>=2?8:4);i++){const mist=new THREE.Mesh(new THREE.SphereGeometry(.08,7,5),coldMat);stationMeshes.get("armazenamento")?.add(mist);coldMist.push(mist);}

    const statusLights=[];
    const lightMat=new THREE.MeshBasicMaterial({color:0x57d6a3});
    for(const id of ["higiene","processo","conservacao","embalagem","armazenamento"]){
      const light=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),lightMat.clone());
      light.position.set(.62,1.48,.62);
      stationMeshes.get(id)?.add(light);
      statusLights.push(light);
    }

    return{
      group,
      packages,
      liquidDrops,
      valve,
      fan,
      washJets,mixer,processLiquid,scanner,coldMist,
      statusLights,
      update:(t,step=0)=>{
        packages.forEach((pkg,i)=>{
          const cycle=(t*.36+i/packages.length)%1;
          pkg.position.x=-1.25+cycle*2.5;
          pkg.rotation.y=cycle*Math.PI*.15;
        });

        liquidDrops.forEach((drop,i)=>{
          const cycle=(t*.55+i/liquidDrops.length)%1;
          drop.position.set(
            -.48+cycle*.96,
            1.55-Math.sin(cycle*Math.PI)*.34,
            .12*Math.sin(cycle*Math.PI*2)
          );
          drop.scale.setScalar(.72+Math.sin(cycle*Math.PI)*.35);
        });

        valve.rotation.z=t*.52;fan.rotation.z=-t*3.6;mixer.rotation.y=t*1.25;
        processLiquid.scale.y=.86+Math.sin(t*.72)*.10;processLiquid.position.y=.47+Math.sin(t*.72)*.015;
        scanner.material.opacity=.12+(Math.sin(t*4.2)+1)*.10;scanner.position.x=.72+Math.sin(t*.9)*.06;
        washJets.forEach((jet,i)=>{jet.scale.y=.72+(Math.sin(t*3+i*.8)+1)*.18;jet.material.opacity=.36+(Math.sin(t*2.1+i)+1)*.08;});
        coldMist.forEach((mist,i)=>{const phase=(t*.22+i/coldMist.length)%1;mist.position.set(-.52+phase*1.04,.5+phase*.72,-.32+Math.sin(phase*Math.PI*2+i)*.28);mist.scale.setScalar(.65+phase*.7);mist.material.opacity=.24*(1-phase);});

        statusLights.forEach((light,i)=>{
          const active=i<=Math.max(0,step-1);
          light.material.color.setHex(active?0x57d6a3:0x736e4c);
          light.scale.setScalar(active?1+Math.sin(t*2+i)*.12:.82);
        });
      }
    };
  };

  return{attach};
}
