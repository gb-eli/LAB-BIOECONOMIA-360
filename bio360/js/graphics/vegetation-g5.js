export function createVegetationG5(THREE){
  const addTerritoryVegetation=(scene,{
    profile,
    seed=821,
    center=[-6.8,-4.5],
    spread=[6.4,5.0]
  }={})=>{
    const group=new THREE.Group();
    group.name="vegetation-g5";

    const treeCount=Math.max(18,Math.round(profile?.vegetation || 42));
    const grassCount=Math.max(80,Math.round(treeCount*4.3));
    const rng=mulberry32(seed);

    const trunkGeo=new THREE.CylinderGeometry(.065,.11,.72,8);
    const trunkMat=new THREE.MeshStandardMaterial({color:0x6f5039,roughness:.96});

    const crownGeo=new THREE.IcosahedronGeometry(.42,profile?.rank>=2?1:0);
    const crownMat=new THREE.MeshStandardMaterial({
      color:0x4d9358,
      roughness:.94,
      vertexColors:true
    });

    const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,treeCount);
    const crowns=new THREE.InstancedMesh(crownGeo,crownMat,treeCount*2);
    trunks.castShadow=profile?.shadows===true;
    trunks.receiveShadow=true;
    crowns.castShadow=profile?.shadows===true;
    crowns.receiveShadow=true;

    const dummy=new THREE.Object3D();
    const color=new THREE.Color();

    for(let i=0;i<treeCount;i++){
      const angle=rng()*Math.PI*2;
      const radius=Math.sqrt(rng());
      const x=center[0]+Math.cos(angle)*radius*spread[0];
      const z=center[1]+Math.sin(angle)*radius*spread[1];
      const scale=.72+rng()*.72;

      dummy.position.set(x,.36*scale,z);
      dummy.rotation.y=rng()*Math.PI*2;
      dummy.scale.set(scale,scale,scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(i,dummy.matrix);

      for(let layer=0;layer<2;layer++){
        const index=i*2+layer;
        const offset=(layer===0?-.10:.14);
        dummy.position.set(x+(rng()-.5)*.18,1.02*scale+layer*.36*scale,z+(rng()-.5)*.18);
        dummy.rotation.set(0,rng()*Math.PI*2,offset);
        dummy.scale.set(
          scale*(layer===0?1.04:.82),
          scale*(layer===0?.92:.78),
          scale*(layer===0?1.02:.82)
        );
        dummy.updateMatrix();
        crowns.setMatrixAt(index,dummy.matrix);
        color.setHSL(.29+rng()*.045,.36+rng()*.14,.35+rng()*.08);
        crowns.setColorAt(index,color);
      }
    }

    const grassGeo=new THREE.PlaneGeometry(.08,.34);
    grassGeo.translate(0,.17,0);
    const grassMat=new THREE.MeshStandardMaterial({
      color:0x6c9f58,
      roughness:1,
      side:THREE.DoubleSide,
      transparent:true,
      opacity:.9
    });
    const grass=new THREE.InstancedMesh(grassGeo,grassMat,grassCount);

    for(let i=0;i<grassCount;i++){
      const x=-12+rng()*24;
      const z=-9+rng()*18;
      if(Math.abs(x)<2.2 && Math.abs(z)<9) continue;
      const scale=.55+rng()*.85;
      dummy.position.set(x,.015,z);
      dummy.rotation.set(0,rng()*Math.PI*2,(rng()-.5)*.14);
      dummy.scale.set(scale,scale,scale);
      dummy.updateMatrix();
      grass.setMatrixAt(i,dummy.matrix);
    }

    group.add(trunks,crowns,grass);
    scene.add(group);

    return {
      group,
      count:treeCount,
      trunks,
      crowns,
      grass,
      update:(t)=>{
        crowns.rotation.z=Math.sin(t*.72)*.008;
        crowns.rotation.x=Math.cos(t*.51)*.004;
        grass.rotation.z=Math.sin(t*.9)*.003;
      }
    };
  };

  const addLandscapeVegetation=(scene,{
    profile,
    seed=303,
    treeCount=null,
    grassCount=null,
    radiusX=9,
    radiusZ=7,
    center=[0,0],
    exclusionRadius=2.2,
    crownColor=0x4b8d55
  }={})=>{
    const group=new THREE.Group();
    group.name="landscape-vegetation-g5";

    const count=Math.max(12,treeCount ?? Math.round((profile?.vegetation||40)*.82));
    const grassTotal=Math.max(50,grassCount ?? Math.round(count*3.4));
    const rng=mulberry32(seed);
    const dummy=new THREE.Object3D();
    const color=new THREE.Color();

    const trunkGeo=new THREE.CylinderGeometry(.055,.095,.62,8);
    const trunkMat=new THREE.MeshStandardMaterial({color:0x694c35,roughness:.97});
    const crownGeo=new THREE.IcosahedronGeometry(.37,profile?.rank>=2?1:0);
    const crownMat=new THREE.MeshStandardMaterial({color:crownColor,roughness:.95,vertexColors:true});

    const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,count);
    const crowns=new THREE.InstancedMesh(crownGeo,crownMat,count*2);

    for(let i=0;i<count;i++){
      const angle=rng()*Math.PI*2;
      const radius=Math.sqrt(rng());
      let x=center[0]+Math.cos(angle)*radius*radiusX;
      let z=center[1]+Math.sin(angle)*radius*radiusZ;

      if(Math.hypot(x-center[0],z-center[1])<exclusionRadius){
        const factor=(exclusionRadius+1.2)/Math.max(.1,Math.hypot(x-center[0],z-center[1]));
        x=center[0]+(x-center[0])*factor;
        z=center[1]+(z-center[1])*factor;
      }

      const scale=.65+rng()*.82;
      dummy.position.set(x,.31*scale,z);
      dummy.rotation.set(0,rng()*Math.PI*2,0);
      dummy.scale.set(scale,scale,scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(i,dummy.matrix);

      for(let layer=0;layer<2;layer++){
        const index=i*2+layer;
        dummy.position.set(x+(rng()-.5)*.15,.93*scale+layer*.31*scale,z+(rng()-.5)*.15);
        dummy.rotation.set((rng()-.5)*.1,rng()*Math.PI*2,(rng()-.5)*.12);
        dummy.scale.set(
          scale*(layer===0?.98:.78),
          scale*(layer===0?.90:.72),
          scale*(layer===0?.98:.80)
        );
        dummy.updateMatrix();
        crowns.setMatrixAt(index,dummy.matrix);
        color.setHSL(.285+rng()*.055,.34+rng()*.18,.34+rng()*.09);
        crowns.setColorAt(index,color);
      }
    }

    trunks.castShadow=profile?.shadows===true;
    crowns.castShadow=profile?.shadows===true;
    trunks.receiveShadow=true;
    crowns.receiveShadow=true;

    const grassGeo=new THREE.PlaneGeometry(.075,.30);
    grassGeo.translate(0,.15,0);
    const grassMat=new THREE.MeshStandardMaterial({
      color:0x72a35c,roughness:1,side:THREE.DoubleSide,transparent:true,opacity:.86
    });
    const grass=new THREE.InstancedMesh(grassGeo,grassMat,grassTotal);

    for(let i=0;i<grassTotal;i++){
      const x=center[0]+(rng()-.5)*radiusX*2.1;
      const z=center[1]+(rng()-.5)*radiusZ*2.1;
      if(Math.hypot(x-center[0],z-center[1])<exclusionRadius*.72)continue;
      const sc=.45+rng()*.88;
      dummy.position.set(x,.01,z);
      dummy.rotation.set(0,rng()*Math.PI*2,(rng()-.5)*.12);
      dummy.scale.set(sc,sc,sc);
      dummy.updateMatrix();
      grass.setMatrixAt(i,dummy.matrix);
    }

    group.add(trunks,crowns,grass);
    scene.add(group);

    return{
      group,
      count,
      trunks,
      crowns,
      grass,
      update:t=>{
        crowns.rotation.z=Math.sin(t*.68)*.007;
        crowns.rotation.x=Math.cos(t*.47)*.0035;
        grass.rotation.z=Math.sin(t*.94)*.0025;
      }
    };
  };

  return {addTerritoryVegetation,addLandscapeVegetation};
}

function mulberry32(seed){
  return function(){
    let t=seed+=0x6D2B79F5;
    t=Math.imul(t^t>>>15,t|1);
    t^=t+Math.imul(t^t>>>7,t|61);
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
