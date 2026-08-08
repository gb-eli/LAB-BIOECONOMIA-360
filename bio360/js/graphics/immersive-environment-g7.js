export function createImmersiveEnvironmentG7(THREE){
  const createTerritory=(scene,{profile}={})=>{
    const root=new THREE.Group();
    root.name="immersive-g7-territory";
    scene.add(root);

    const factor=profileFactor(profile);
    const horizon=createHorizonForest(THREE,root,{
      count:Math.round(44*factor),
      radiusX:15.5,
      radiusZ:12.5,
      center:[0,0],
      color:0x1f5938,
      seed:3107
    });

    const fence=createFenceLine(THREE,root,{
      points:[[-8.6,1.3],[-8.5,6.3],[-3.7,6.2],[-3.7,1.2]],
      color:0x745638,
      density:factor
    });

    const poles=createUtilityLine(THREE,root,{
      points:[[-1.7,7.4],[1.0,5.8],[3.7,4.0],[5.8,1.7]],
      density:factor
    });

    const windmill=createWindPump(THREE,{
      color:0x8fa6a0,
      accent:0xd6b35b
    });
    windmill.group.position.set(-9.2,0,2.7);
    windmill.group.scale.setScalar(.78);
    root.add(windmill.group);

    const vehicle=createServiceVehicle(THREE,{color:0xd5a45e});
    root.add(vehicle.group);

    const signs=createSignCluster(THREE,root,[
      [-6.6,0,1.4,"produção"],
      [2.8,0,3.0,"comunidade"],
      [6.0,0,-2.2,"agro"],
      [6.3,0,4.4,"circular"]
    ],{density:factor});

    const birds=createBirdFlock(THREE,root,{
      count:Math.max(3,Math.round(8*factor)),
      center:[0,7,-2],
      radius:8
    });

    const update=(t,runtime=1)=>{
      windmill.rotor.rotation.z=-t*1.35;
      vehicle.group.position.set(
        -4.2+Math.sin(t*.13)*5.4,
        .18,
        4.7+Math.cos(t*.13)*1.6
      );
      vehicle.group.rotation.y=Math.atan2(
        Math.cos(t*.13)*5.4,
        -Math.sin(t*.13)*1.6
      )+.15;
      birds.update(t);
      horizon.setDensity(runtime);
      fence.setDensity(runtime);
      poles.setDensity(runtime);
      signs.setDensity(runtime);
    };

    return api(root,update,[
      horizon.dispose,fence.dispose,poles.dispose,signs.dispose,birds.dispose
    ]);
  };

  const createAgroindustry=(scene,{profile}={})=>{
    const root=new THREE.Group();
    root.name="immersive-g7-agroindustry";
    scene.add(root);

    const factor=profileFactor(profile);

    const structure=createIndustrialStructure(THREE,root,{density:factor});
    const pallets=createPalletStacks(THREE,root,{
      count:Math.round(16*factor),
      origin:[5.9,.08,4.4]
    });
    const forklift=createForklift(THREE);
    root.add(forklift.group);
    const steam=createSteamWisps(THREE,root,{
      count:Math.max(4,Math.round(12*factor))
    });

    const signage=createIndustrialSigns(THREE,root,{
      count:Math.max(3,Math.round(6*factor))
    });

    const update=(t,runtime=1)=>{
      const phase=(Math.sin(t*.22)+1)*.5;
      forklift.group.position.set(-6.2+phase*11.5,.04,4.45);
      forklift.group.rotation.y=phase>.5?Math.PI:0;
      forklift.forks.position.y=.30+(Math.sin(t*.65)+1)*.08;
      forklift.beacon.material.emissiveIntensity=.5+(Math.sin(t*5)+1)*.55;
      steam.update(t);
      structure.setDensity(runtime);
      pallets.setDensity(runtime);
      signage.setDensity(runtime);
    };

    return api(root,update,[
      structure.dispose,pallets.dispose,steam.dispose,signage.dispose
    ]);
  };

  const createAnimalFarm=(scene,{profile}={})=>{
    const root=new THREE.Group();
    root.name="immersive-g7-animal-farm";
    scene.add(root);

    const factor=profileFactor(profile);

    const horizon=createHorizonForest(THREE,root,{
      count:Math.round(34*factor),
      radiusX:14.5,
      radiusZ:10.5,
      color:0x285c39,
      seed:972
    });

    const hay=createHayBales(THREE,root,{
      count:Math.max(5,Math.round(12*factor)),
      origin:[6.6,.45,3.6]
    });

    const windmill=createWindPump(THREE,{
      color:0x7f9793,
      accent:0xd2b45d
    });
    windmill.group.position.set(7.7,0,-.8);
    windmill.group.scale.setScalar(.9);
    root.add(windmill.group);

    const tank=createWaterTower(THREE);
    tank.position.set(7.8,0,-4.6);
    root.add(tank);

    const track=createServiceTrack(THREE,root,{
      from:[-8.5,6.2],
      to:[8.5,6.2],
      segments:Math.round(18*factor)
    });

    const tractor=createServiceVehicle(THREE,{color:0x6f9d55,tractor:true});
    root.add(tractor.group);

    const birds=createBirdFlock(THREE,root,{
      count:Math.max(2,Math.round(6*factor)),
      center:[-1,6,-1],
      radius:6
    });

    const update=(t,runtime=1)=>{
      windmill.rotor.rotation.z=-t*1.7;
      tractor.group.position.set(
        -6.8+((t*.38)%13.6),
        .17,
        6.0
      );
      tractor.group.rotation.y=-Math.PI/2;
      birds.update(t);
      horizon.setDensity(runtime);
      hay.setDensity(runtime);
      track.setDensity(runtime);
    };

    return api(root,update,[
      horizon.dispose,hay.dispose,track.dispose,birds.dispose
    ]);
  };

  const createTourism=(scene,{profile}={})=>{
    const root=new THREE.Group();
    root.name="immersive-g7-tourism";
    scene.add(root);

    const factor=profileFactor(profile);

    const rails=createTrailRails(THREE,root,{
      count:Math.max(8,Math.round(20*factor))
    });
    const benches=createBenches(THREE,root,{
      count:Math.max(3,Math.round(7*factor))
    });
    const signs=createWayfinding(THREE,root,{
      count:Math.max(3,Math.round(8*factor))
    });

    const canoe=createCanoe(THREE);
    root.add(canoe.group);

    const reeds=createReeds(THREE,root,{
      count:Math.max(18,Math.round(54*factor))
    });

    const birds=createBirdFlock(THREE,root,{
      count:Math.max(3,Math.round(10*factor)),
      center:[-4,6,-3],
      radius:7
    });

    const update=(t,runtime=1)=>{
      canoe.group.position.set(
        -5+Math.sin(t*.18)*1.55,
        .11,
        -3+Math.cos(t*.18)*.85
      );
      canoe.group.rotation.y=t*.18+.4;
      birds.update(t);
      rails.setDensity(runtime);
      benches.setDensity(runtime);
      signs.setDensity(runtime);
      reeds.setDensity(runtime);
    };

    return api(root,update,[
      rails.dispose,benches.dispose,signs.dispose,reeds.dispose,birds.dispose
    ]);
  };

  const createVisitors=(scene,{count=36,profile}={})=>{
    const root=new THREE.Group();
    root.name="immersive-g7-visitors";
    scene.add(root);

    const factor=profileFactor(profile);
    const max=Math.max(8,Math.round(count*factor));
    const visitors=[];

    const bodyGeo=new THREE.CapsuleGeometry(.07,.20,3,6);
    const headGeo=new THREE.SphereGeometry(.075,8,6);
    const palette=[0xd59c6d,0x6f9f86,0x7b86a8,0xb47d69,0xc49d62];

    for(let i=0;i<max;i++){
      const g=new THREE.Group();
      const body=new THREE.Mesh(
        bodyGeo,
        new THREE.MeshStandardMaterial({
          color:palette[i%palette.length],
          roughness:.82
        })
      );
      body.position.y=.21;
      const head=new THREE.Mesh(
        headGeo,
        new THREE.MeshStandardMaterial({
          color:i%3===0?0xb77d5d:0xc99674,
          roughness:.88
        })
      );
      head.position.y=.47;
      g.add(body,head);
      g.visible=false;
      root.add(g);
      visitors.push(g);
    }

    return{
      root,
      visitors,
      dispose:()=>disposeGroup(root)
    };
  };

  return{
    territory:createTerritory,
    agroindustry:createAgroindustry,
    animalFarm:createAnimalFarm,
    tourism:createTourism,
    visitors:createVisitors
  };
}

function api(root,update,disposers=[]){
  return{
    root,
    update,
    dispose:()=>{
      disposers.forEach(fn=>fn?.());
      disposeGroup(root);
    }
  };
}

function profileFactor(profile){
  const rank=Number(profile?.rank||0);
  return[.48,.68,.86,1][Math.max(0,Math.min(3,rank))];
}

function seeded(seed=1){
  let s=seed>>>0;
  return()=>{
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
}

function createHorizonForest(THREE,parent,{
  count=32,radiusX=15,radiusZ=11,center=[0,0],color=0x28583a,seed=1
}={}){
  const rand=seeded(seed);
  const trunkGeo=new THREE.CylinderGeometry(.08,.12,1.2,5);
  const crownGeo=new THREE.ConeGeometry(.55,1.6,7);
  const trunkMat=new THREE.MeshStandardMaterial({color:0x574b38,roughness:1});
  const crownMat=new THREE.MeshStandardMaterial({color,roughness:.98});

  const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,count);
  const crowns=new THREE.InstancedMesh(crownGeo,crownMat,count);
  const matrix=new THREE.Matrix4();
  const q=new THREE.Quaternion();
  const scale=new THREE.Vector3();
  const pos=new THREE.Vector3();

  for(let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2+(rand()-.5)*.16;
    const rx=radiusX*(.88+rand()*.22);
    const rz=radiusZ*(.88+rand()*.22);
    const h=.8+rand()*.75;
    pos.set(center[0]+Math.cos(a)*rx,.6*h,center[1]+Math.sin(a)*rz);
    scale.set(.8+rand()*.55,h,.8+rand()*.55);
    matrix.compose(pos,q,scale);
    trunks.setMatrixAt(i,matrix);

    pos.y=1.55*h;
    scale.set(1+rand()*.55,h,1+rand()*.55);
    matrix.compose(pos,q,scale);
    crowns.setMatrixAt(i,matrix);
  }

  trunks.receiveShadow=true;
  crowns.castShadow=true;
  parent.add(trunks,crowns);

  return densityApi([trunks,crowns],count);
}

function createFenceLine(THREE,parent,{points=[],color=0x6f5237,density=1}={}){
  const postCount=Math.max(4,Math.round(32*density));
  const railCount=Math.max(4,Math.round(24*density));
  const postGeo=new THREE.BoxGeometry(.07,.75,.07);
  const railGeo=new THREE.BoxGeometry(.72,.055,.055);
  const mat=new THREE.MeshStandardMaterial({color,roughness:1});
  const posts=new THREE.InstancedMesh(postGeo,mat,postCount);
  const rails=new THREE.InstancedMesh(railGeo,mat,railCount);
  const path=polylineSamples(points,postCount);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(1,1,1),p=new THREE.Vector3();

  path.forEach((v,i)=>{
    p.set(v.x,.38,v.z);
    m.compose(p,q,s);
    posts.setMatrixAt(i,m);
  });

  const railSamples=polylineSamples(points,railCount);
  railSamples.forEach((v,i)=>{
    const next=railSamples[Math.min(i+1,railSamples.length-1)]||v;
    const angle=Math.atan2(next.z-v.z,next.x-v.x);
    q.setFromAxisAngle(new THREE.Vector3(0,1,0),-angle);
    p.set(v.x,.42,v.z);
    m.compose(p,q,s);
    rails.setMatrixAt(i,m);
  });

  parent.add(posts,rails);
  return densityApi([posts,rails],Math.max(postCount,railCount));
}

function createUtilityLine(THREE,parent,{points=[],density=1}={}){
  const max=Math.max(3,Math.min(points.length,Math.round(points.length*density+.5)));
  const group=new THREE.Group();
  parent.add(group);
  const poleMat=new THREE.MeshStandardMaterial({color:0x6d5740,roughness:1});
  const lineMat=new THREE.LineBasicMaterial({color:0x313a38,transparent:true,opacity:.55});
  const poles=[];
  const visiblePoints=points.slice(0,max);

  for(const [x,z] of visiblePoints){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,2.4,7),poleMat);
    pole.position.set(x,1.2,z);
    group.add(pole);
    poles.push(pole);
  }

  if(visiblePoints.length>1){
    const lineGeo=new THREE.BufferGeometry().setFromPoints(
      visiblePoints.map(([x,z])=>new THREE.Vector3(x,2.28,z))
    );
    group.add(new THREE.Line(lineGeo,lineMat));
  }

  return{
    setDensity:f=>{group.visible=f>.38;},
    dispose:()=>disposeGroup(group)
  };
}

function createWindPump(THREE,{color=0x8ba09d,accent=0xc9ae62}={}){
  const group=new THREE.Group();
  const steel=new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.48});
  const accentMat=new THREE.MeshStandardMaterial({color:accent,roughness:.62});
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(.08,.22,3.4,8),steel);
  tower.position.y=1.7;
  group.add(tower);

  const rotor=new THREE.Group();
  rotor.position.set(0,3.25,.12);
  rotor.rotation.x=Math.PI/2;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.035,7,20),steel);
  rotor.add(ring);
  for(let i=0;i<8;i++){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.62,.065,.03),accentMat);
    blade.position.x=.31;
    blade.rotation.z=i*Math.PI/4;
    rotor.add(blade);
  }
  group.add(rotor);
  return{group,rotor};
}

function createServiceVehicle(THREE,{color=0xd3a35b,tractor=false}={}){
  const group=new THREE.Group();
  const body=new THREE.Mesh(
    new THREE.BoxGeometry(tractor?1.0:1.25,.38,.62),
    new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.08})
  );
  body.position.y=.38;
  group.add(body);

  if(!tractor){
    const cab=new THREE.Mesh(
      new THREE.BoxGeometry(.52,.42,.56),
      new THREE.MeshStandardMaterial({color:0x96b4b4,roughness:.35,metalness:.12})
    );
    cab.position.set(.34,.72,0);
    group.add(cab);
  }else{
    const cab=new THREE.Mesh(
      new THREE.BoxGeometry(.42,.5,.52),
      new THREE.MeshStandardMaterial({color:0x4d7353,roughness:.7})
    );
    cab.position.set(.08,.73,0);
    group.add(cab);
  }

  const wheelMat=new THREE.MeshStandardMaterial({color:0x1d211f,roughness:.9});
  for(const x of [-.38,.38]){
    for(const z of [-.34,.34]){
      const wheel=new THREE.Mesh(
        new THREE.CylinderGeometry(.16,.16,.12,10),
        wheelMat
      );
      wheel.rotation.x=Math.PI/2;
      wheel.position.set(x,.18,z);
      group.add(wheel);
    }
  }

  group.scale.setScalar(tractor?.82:.72);
  return{group};
}

function createSignCluster(THREE,parent,items,{density=1}={}){
  const group=new THREE.Group();
  parent.add(group);
  const boardMat=new THREE.MeshStandardMaterial({color:0x4f785d,roughness:.88});
  const postMat=new THREE.MeshStandardMaterial({color:0x6c5238,roughness:1});
  const signs=[];

  items.slice(0,Math.max(1,Math.round(items.length*density))).forEach(([x,y,z])=>{
    const sign=new THREE.Group();
    const post=new THREE.Mesh(new THREE.BoxGeometry(.055,.9,.055),postMat);
    post.position.y=.45;
    const board=new THREE.Mesh(new THREE.BoxGeometry(.72,.34,.06),boardMat);
    board.position.y=.92;
    sign.add(post,board);
    sign.position.set(x,y,z);
    group.add(sign);
    signs.push(sign);
  });

  return{
    setDensity:f=>{group.visible=f>.32;},
    dispose:()=>disposeGroup(group)
  };
}

function createBirdFlock(THREE,parent,{count=6,center=[0,6,0],radius=6}={}){
  const group=new THREE.Group();
  parent.add(group);
  const wingMat=new THREE.MeshBasicMaterial({color:0xd9e4df,side:THREE.DoubleSide});
  const birds=[];
  for(let i=0;i<count;i++){
    const bird=new THREE.Group();
    const wing1=new THREE.Mesh(new THREE.PlaneGeometry(.28,.07),wingMat);
    const wing2=wing1.clone();
    wing1.position.x=-.12;
    wing2.position.x=.12;
    wing1.rotation.z=.28;
    wing2.rotation.z=-.28;
    bird.add(wing1,wing2);
    group.add(bird);
    birds.push({bird,wing1,wing2,phase:i/count*Math.PI*2});
  }

  return{
    update:t=>{
      birds.forEach((entry,i)=>{
        const a=t*.08+entry.phase;
        entry.bird.position.set(
          center[0]+Math.cos(a)*radius*(.65+(i%3)*.12),
          center[1]+Math.sin(a*1.7+i)*.45,
          center[2]+Math.sin(a)*radius
        );
        entry.bird.rotation.y=-a+.2;
        const flap=Math.sin(t*4+i)*.32;
        entry.wing1.rotation.z=.18+flap;
        entry.wing2.rotation.z=-.18-flap;
      });
    },
    dispose:()=>disposeGroup(group)
  };
}

function createIndustrialStructure(THREE,parent,{density=1}={}){
  const group=new THREE.Group();
  parent.add(group);

  const steel=new THREE.MeshStandardMaterial({
    color:0x71847e,metalness:.34,roughness:.52
  });
  const wall=new THREE.MeshStandardMaterial({
    color:0xc5d1cc,roughness:.78
  });
  const glow=new THREE.MeshBasicMaterial({
    color:0xc6f4df,transparent:true,opacity:.38
  });

  const beams=[];
  for(let i=0;i<Math.max(5,Math.round(10*density));i++){
    const beam=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,12.2),steel);
    beam.position.set(-8+i*(16/Math.max(1,Math.round(10*density)-1)),3.42,0);
    group.add(beam);
    beams.push(beam);
  }

  for(const x of [-8.6,-4.3,0,4.3,8.6]){
    const column=new THREE.Mesh(new THREE.BoxGeometry(.16,3.4,.16),steel);
    column.position.set(x,1.7,-5.8);
    group.add(column);
  }

  for(let i=0;i<Math.max(4,Math.round(7*density));i++){
    const window=new THREE.Mesh(new THREE.BoxGeometry(1.35,.62,.03),glow);
    window.position.set(-6.7+i*2.2,2.0,-6.18);
    group.add(window);
  }

  const loadingDoor=new THREE.Mesh(new THREE.BoxGeometry(3.1,2.35,.08),wall);
  loadingDoor.position.set(6.4,1.17,-6.14);
  group.add(loadingDoor);

  return{
    setDensity:f=>{beams.forEach((b,i)=>b.visible=i<Math.max(4,Math.round(beams.length*f)));},
    dispose:()=>disposeGroup(group)
  };
}

function createPalletStacks(THREE,parent,{count=12,origin=[5,.1,4]}={}){
  const geo=new THREE.BoxGeometry(.72,.16,.62);
  const mat=new THREE.MeshStandardMaterial({color:0x9b7147,roughness:.94});
  const mesh=new THREE.InstancedMesh(geo,mat,count);
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1);
  for(let i=0;i<count;i++){
    p.set(
      origin[0]+(i%4)*.82,
      origin[1]+Math.floor((i%8)/4)*.18,
      origin[2]+Math.floor(i/8)*.78
    );
    m.compose(p,q,sc);
    mesh.setMatrixAt(i,m);
  }
  parent.add(mesh);
  return densityApi([mesh],count);
}

function createForklift(THREE){
  const group=new THREE.Group();
  const yellow=new THREE.MeshStandardMaterial({color:0xd9ad3f,roughness:.63});
  const dark=new THREE.MeshStandardMaterial({color:0x2a302e,roughness:.85});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.82,.55,.7),yellow);
  body.position.y=.42;
  group.add(body);
  const mast=new THREE.Mesh(new THREE.BoxGeometry(.08,1.05,.6),dark);
  mast.position.set(.48,.76,0);
  group.add(mast);
  const forks=new THREE.Mesh(new THREE.BoxGeometry(.72,.055,.58),dark);
  forks.position.set(.78,.30,0);
  group.add(forks);
  for(const x of [-.3,.3])for(const z of [-.38,.38]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.12,10),dark);
    wheel.rotation.x=Math.PI/2;
    wheel.position.set(x,.16,z);
    group.add(wheel);
  }
  const beacon=new THREE.Mesh(
    new THREE.SphereGeometry(.07,8,6),
    new THREE.MeshStandardMaterial({
      color:0xffb348,emissive:0xff7a22,emissiveIntensity:.8
    })
  );
  beacon.position.set(-.18,.82,0);
  group.add(beacon);
  group.scale.setScalar(.82);
  return{group,forks,beacon};
}

function createSteamWisps(THREE,parent,{count=8}={}){
  const group=new THREE.Group();
  parent.add(group);
  const mat=new THREE.MeshBasicMaterial({
    color:0xe8f1ed,transparent:true,opacity:.16,depthWrite:false
  });
  const wisps=[];
  for(let i=0;i<count;i++){
    const w=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),mat.clone());
    group.add(w);
    wisps.push(w);
  }
  return{
    update:t=>{
      wisps.forEach((w,i)=>{
        const phase=(t*.16+i/count)%1;
        w.position.set(
          -1.7+(i%4)*1.15,
          1.8+phase*1.4,
          -2.7+(i%3)*1.4
        );
        w.scale.setScalar(.6+phase*1.4);
        w.material.opacity=.16*(1-phase);
      });
    },
    dispose:()=>disposeGroup(group)
  };
}

function createIndustrialSigns(THREE,parent,{count=5}={}){
  const group=new THREE.Group();
  parent.add(group);
  const colors=[0x6bc99a,0xe0ba5a,0x6ea6bf,0xd18c6b,0x8b78b5];
  for(let i=0;i<count;i++){
    const frame=new THREE.Mesh(
      new THREE.BoxGeometry(1.0,.38,.045),
      new THREE.MeshStandardMaterial({color:0x33443f,roughness:.75})
    );
    frame.position.set(-5.8+i*2.6,2.85,-5.95);
    group.add(frame);
    const light=new THREE.Mesh(
      new THREE.BoxGeometry(.78,.05,.052),
      new THREE.MeshBasicMaterial({color:colors[i%colors.length]})
    );
    light.position.set(frame.position.x,2.85,-5.91);
    group.add(light);
  }
  return{
    setDensity:f=>{group.visible=f>.42;},
    dispose:()=>disposeGroup(group)
  };
}

function createHayBales(THREE,parent,{count=8,origin=[6,.4,3]}={}){
  const geo=new THREE.CylinderGeometry(.33,.33,.72,10);
  geo.rotateZ(Math.PI/2);
  const mat=new THREE.MeshStandardMaterial({color:0xc1a45b,roughness:1});
  const mesh=new THREE.InstancedMesh(geo,mat,count);
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1);
  for(let i=0;i<count;i++){
    p.set(
      origin[0]+(i%4)*.72,
      origin[1]+Math.floor((i%8)/4)*.57,
      origin[2]+Math.floor(i/8)*.76
    );
    q.setFromAxisAngle(new THREE.Vector3(0,1,0),(i%2)*Math.PI/2);
    m.compose(p,q,sc);
    mesh.setMatrixAt(i,m);
  }
  parent.add(mesh);
  return densityApi([mesh],count);
}

function createWaterTower(THREE){
  const group=new THREE.Group();
  const steel=new THREE.MeshStandardMaterial({color:0x879a96,metalness:.34,roughness:.5});
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.64,.64,1.05,18),steel);
  tank.position.y=2.45;
  group.add(tank);
  for(const x of [-.42,.42])for(const z of [-.42,.42]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,2.0,.08),steel);
    leg.position.set(x,1.0,z);
    group.add(leg);
  }
  return group;
}

function createServiceTrack(THREE,parent,{from=[-7,6],to=[7,6],segments=16}={}){
  const geo=new THREE.BoxGeometry(.72,.025,.45);
  const mat=new THREE.MeshStandardMaterial({color:0x8a765d,roughness:1});
  const mesh=new THREE.InstancedMesh(geo,mat,segments);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
  for(let i=0;i<segments;i++){
    const u=i/Math.max(1,segments-1);
    p.set(
      from[0]+(to[0]-from[0])*u,
      .025,
      from[1]+(to[1]-from[1])*u
    );
    m.compose(p,q,sc);
    mesh.setMatrixAt(i,m);
  }
  parent.add(mesh);
  return densityApi([mesh],segments);
}

function createTrailRails(THREE,parent,{count=18}={}){
  const posts=new THREE.InstancedMesh(
    new THREE.BoxGeometry(.055,.65,.055),
    new THREE.MeshStandardMaterial({color:0x70543a,roughness:1}),
    count
  );
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1),p=new THREE.Vector3();
  for(let i=0;i<count;i++){
    const x=-6+i*(11/Math.max(1,count-1));
    const z=3+Math.sin(i*.54)*1.85;
    p.set(x,.34,z+.5);
    m.compose(p,q,sc);
    posts.setMatrixAt(i,m);
  }
  parent.add(posts);
  return densityApi([posts],count);
}

function createBenches(THREE,parent,{count=5}={}){
  const group=new THREE.Group();parent.add(group);
  const wood=new THREE.MeshStandardMaterial({color:0x79573a,roughness:1});
  for(let i=0;i<count;i++){
    const bench=new THREE.Group();
    const seat=new THREE.Mesh(new THREE.BoxGeometry(.9,.09,.3),wood);
    seat.position.y=.36;
    const back=new THREE.Mesh(new THREE.BoxGeometry(.9,.36,.07),wood);
    back.position.set(0,.58,.12);
    bench.add(seat,back);
    bench.position.set(-4.8+i*2.1,0,5.0+Math.sin(i*.8)*.6);
    bench.rotation.y=(i%2?.14:-.18);
    group.add(bench);
  }
  return{
    setDensity:f=>{group.children.forEach((c,i)=>c.visible=i<Math.max(1,Math.round(group.children.length*f)));},
    dispose:()=>disposeGroup(group)
  };
}

function createWayfinding(THREE,parent,{count=6}={}){
  const group=new THREE.Group();parent.add(group);
  const postMat=new THREE.MeshStandardMaterial({color:0x6b5239,roughness:1});
  const boardMat=new THREE.MeshStandardMaterial({color:0x4c7f60,roughness:.86});
  for(let i=0;i<count;i++){
    const sign=new THREE.Group();
    const post=new THREE.Mesh(new THREE.BoxGeometry(.055,.95,.055),postMat);
    post.position.y=.47;
    const board=new THREE.Mesh(new THREE.BoxGeometry(.55,.28,.05),boardMat);
    board.position.y=.94;
    sign.add(post,board);
    sign.position.set(-5.6+i*1.7,0,2.5+Math.sin(i*.55)*1.7);
    group.add(sign);
  }
  return{
    setDensity:f=>{group.children.forEach((c,i)=>c.visible=i<Math.max(1,Math.round(group.children.length*f)));},
    dispose:()=>disposeGroup(group)
  };
}

function createCanoe(THREE){
  const group=new THREE.Group();
  const hull=new THREE.Mesh(
    new THREE.CapsuleGeometry(.24,1.45,4,8),
    new THREE.MeshStandardMaterial({color:0xa76a3d,roughness:.82})
  );
  hull.rotation.z=Math.PI/2;
  hull.scale.y=.48;
  group.add(hull);
  const paddle=new THREE.Mesh(
    new THREE.BoxGeometry(1.15,.04,.08),
    new THREE.MeshStandardMaterial({color:0x6c4e34,roughness:1})
  );
  paddle.position.y=.18;
  paddle.rotation.y=.34;
  group.add(paddle);
  group.scale.setScalar(.75);
  return{group};
}

function createReeds(THREE,parent,{count=40}={}){
  const geo=new THREE.CylinderGeometry(.015,.025,.65,5);
  const mat=new THREE.MeshStandardMaterial({color:0x5c8751,roughness:1});
  const mesh=new THREE.InstancedMesh(geo,mat,count);
  const rand=seeded(814);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),p=new THREE.Vector3();
  for(let i=0;i<count;i++){
    const side=i%2?1:-1;
    p.set(
      -5+side*(2.45+rand()*.65),
      .32,
      -3+(rand()-.5)*4.4
    );
    sc.set(.8+rand()*.6,.7+rand()*.8,.8+rand()*.6);
    m.compose(p,q,sc);
    mesh.setMatrixAt(i,m);
  }
  parent.add(mesh);
  return densityApi([mesh],count);
}

function densityApi(meshes,max){
  return{
    setDensity:f=>{
      const factor=Math.max(.25,Math.min(1,Number(f||1)));
      meshes.forEach(mesh=>{
        mesh.count=Math.max(1,Math.min(mesh.instanceMatrix?.count||max,Math.round(max*factor)));
      });
    },
    dispose:()=>{
      meshes.forEach(mesh=>{
        mesh.parent?.remove(mesh);
        mesh.geometry?.dispose?.();
        if(Array.isArray(mesh.material))mesh.material.forEach(m=>m.dispose?.());
        else mesh.material?.dispose?.();
      });
    }
  };
}

function polylineSamples(points,count){
  if(points.length<2)return[];
  const segments=[];
  let total=0;
  for(let i=0;i<points.length-1;i++){
    const [ax,az]=points[i],[bx,bz]=points[i+1];
    const len=Math.hypot(bx-ax,bz-az);
    segments.push({ax,az,bx,bz,len,start:total});
    total+=len;
  }
  const out=[];
  for(let i=0;i<count;i++){
    const d=(i/Math.max(1,count-1))*total;
    const seg=segments.find(s=>d<=s.start+s.len)||segments.at(-1);
    const u=seg.len?Math.max(0,Math.min(1,(d-seg.start)/seg.len)):0;
    out.push({
      x:seg.ax+(seg.bx-seg.ax)*u,
      z:seg.az+(seg.bz-seg.az)*u
    });
  }
  return out;
}

function disposeGroup(group){
  if(!group)return;
  group.traverse(obj=>{
    obj.geometry?.dispose?.();
    if(Array.isArray(obj.material))obj.material.forEach(m=>m?.dispose?.());
    else obj.material?.dispose?.();
  });
  group.parent?.remove(group);
}
