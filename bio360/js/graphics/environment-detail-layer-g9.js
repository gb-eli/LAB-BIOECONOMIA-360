export async function createEnvironmentDetailLayerG9({
  THREE,
  scene,
  pbr,
  assetScope,
  quality,
  kind
}){
  const profile=quality?.current||{rank:1,id:"balanced"};
  const rank=Math.max(0,Math.min(3,Number(profile.rank||0)));
  const factor=[.38,.60,.82,1][rank];

  const root=new THREE.Group();
  root.name=`environment-detail-g9-${kind}`;
  scene.add(root);

  const materials=await createMaterials({
    THREE,pbr,assetScope,kind,rank
  });

  const previousFog=scene.fog||null;
  applyAtmosphere(THREE,scene,kind,rank);

  let layer;
  if(kind==="territory"){
    layer=createTerritory(THREE,root,materials,factor);
  }else if(kind==="agroindustry"){
    layer=createAgroindustry(THREE,root,materials,factor);
  }else if(kind==="animal"){
    layer=createAnimal(THREE,root,materials,factor);
  }else if(kind==="tourism"){
    layer=createTourism(THREE,root,materials,factor);
  }else{
    layer={update:()=>{},setRuntime:()=>{},dispose:()=>{}};
  }

  return{
    root,
    update:(t,runtime=1)=>layer.update?.(t,runtime),
    setRuntime:value=>layer.setRuntime?.(value),
    dispose:()=>{
      layer.dispose?.();
      scene.fog=previousFog;
      root.removeFromParent();
      disposeGroup(root);
      disposeMaterials(materials);
    }
  };
}

async function createMaterials({THREE,pbr,assetScope,kind,rank}){
  const out={};

  const fallback=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({
    color,roughness,metalness
  });

  const safe=async(setId,options,fallbackMaterial)=>{
    try{
      return await pbr.create(assetScope,setId,options);
    }catch{
      return fallbackMaterial;
    }
  };

  if(kind==="territory"){
    out.soil=await safe("soil",{repeat:[5,5],color:0xd5c8a7,roughness:.95,normalScale:.62},fallback(0x8b7454,.96));
    out.wood=await safe("wood",{repeat:[4,2],color:0x9d7a55,roughness:.9,normalScale:.52},fallback(0x765338,.94));
    out.vegetation=await safe("vegetation",{repeat:[5,5],color:0xa9c79a,roughness:.96,normalScale:.44},fallback(0x4b7444,.98));
    out.metal=await safe("metal",{repeat:[3,3],color:0x9aa5a1,roughness:.56,normalScale:.45},fallback(0x74827e,.62,.25));
  }

  if(kind==="agroindustry"){
    out.concrete=await safe("concrete",{repeat:[6,6],color:0xd5d9d6,roughness:.8,normalScale:.5},fallback(0x9aa5a0,.84));
    out.metal=await safe("metal",{repeat:[3,3],color:0xb0bbb8,roughness:.48,normalScale:.52},fallback(0x7e8b88,.56,.42));
    out.rubber=fallback(0x282e2c,.96,.02);
    out.paint=fallback(0xd6b64d,.62,.03);
    out.warning=fallback(0x1f2623,.78,.02);
  }

  if(kind==="animal"){
    out.soil=await safe("soil",{repeat:[4,4],color:0xb49a77,roughness:.98,normalScale:.68},fallback(0x765d43,1));
    out.concrete=await safe("concrete",{repeat:[4,4],color:0xc6cbc7,roughness:.9,normalScale:.45},fallback(0x8c9690,.92));
    out.wood=await safe("wood",{repeat:[4,2],color:0xa68459,roughness:.94,normalScale:.5},fallback(0x79583a,.98));
    out.vegetation=await safe("vegetation",{repeat:[5,5],color:0xa7c49c,roughness:.97,normalScale:.4},fallback(0x4d7244,.98));
  }

  if(kind==="tourism"){
    out.soil=await safe("soil",{repeat:[6,4],color:0xc5aa81,roughness:.97,normalScale:.58},fallback(0x7f684c,.98));
    out.wood=await safe("wood",{repeat:[5,2],color:0xa27b51,roughness:.9,normalScale:.56},fallback(0x75553a,.95));
    out.vegetation=await safe("vegetation",{repeat:[6,6],color:0xa8c89a,roughness:.97,normalScale:.45},fallback(0x477043,.98));
    out.stone=await safe("concrete",{repeat:[4,4],color:0xa6aaa5,roughness:.96,normalScale:.6},fallback(0x7b817d,.98));
  }

  out.__rank=rank;
  return out;
}

function applyAtmosphere(THREE,scene,kind,rank){
  const configs={
    territory:{color:0xc9ddd1,density:[.010,.008,.0065,.005][rank]},
    agroindustry:{color:0xb7c3bf,density:[.018,.014,.011,.009][rank]},
    animal:{color:0xcbd8c5,density:[.011,.009,.007,.0055][rank]},
    tourism:{color:0xb8d4c8,density:[.013,.010,.008,.006][rank]}
  };
  const cfg=configs[kind];
  if(cfg)scene.fog=new THREE.FogExp2(cfg.color,cfg.density);
}

function createTerritory(THREE,root,m,factor){
  const detailGroups=[];

  const field=createPatch(THREE,{
    material:m.soil,
    width:7.1,
    depth:4.8,
    position:[-5.8,.012,3.8],
    rotationY:.04
  });
  root.add(field);

  const fieldRows=createFieldLines(THREE,{
    material:m.vegetation,
    count:Math.max(5,Math.round(12*factor)),
    length:6.1,
    spacing:.32
  });
  fieldRows.position.set(-5.8,.035,3.8);
  fieldRows.rotation.y=.04;
  root.add(fieldRows);
  detailGroups.push(fieldRows);

  const road=createPatch(THREE,{
    material:m.soil,
    width:3.0,
    depth:12.4,
    position:[2.1,.018,1.7],
    rotationY:-.78
  });
  root.add(road);

  const stones=createScatter(THREE,{
    material:m.soil,
    count:Math.max(12,Math.round(46*factor)),
    geometry:new THREE.DodecahedronGeometry(.10,0),
    area:[-1.2,5.1,-5.0,6.8],
    y:.10,
    scale:[.45,1.3],
    seed:931
  });
  root.add(stones);
  detailGroups.push(stones);

  const grass=createEdgeGrass(THREE,{
    material:m.vegetation,
    count:Math.max(22,Math.round(95*factor)),
    area:[-10,10,-7.8,7.8],
    seed:1002
  });
  root.add(grass);
  detailGroups.push(grass);

  const culvert=createCulvert(THREE,m.metal,m.concrete||m.soil);
  culvert.position.set(-2.4,.08,-2.2);
  culvert.rotation.y=.56;
  root.add(culvert);

  return runtimeLayer(detailGroups,()=>{
    fieldRows.rotation.y=.04;
  });
}

function createAgroindustry(THREE,root,m,factor){
  const detailGroups=[];

  const safety=createSafetyLanes(THREE,{
    material:m.paint,
    count:Math.max(5,Math.round(9*factor))
  });
  root.add(safety);
  detailGroups.push(safety);

  const drains=createDrainLine(THREE,{
    metal:m.metal,
    count:Math.max(5,Math.round(11*factor))
  });
  drains.position.set(0,.025,-.2);
  root.add(drains);
  detailGroups.push(drains);

  const bollards=createBollards(THREE,{
    material:m.paint,
    count:Math.max(4,Math.round(8*factor))
  });
  root.add(bollards);
  detailGroups.push(bollards);

  const pipes=createPipeRack(THREE,{
    metal:m.metal,
    density:factor
  });
  pipes.position.set(0,2.45,-5.65);
  root.add(pipes);
  detailGroups.push(pipes);

  const mats=createRubberMats(THREE,{
    material:m.rubber,
    count:Math.max(3,Math.round(6*factor))
  });
  root.add(mats);
  detailGroups.push(mats);

  const floorPatch=createPatch(THREE,{
    material:m.concrete,
    width:5.6,
    depth:3.1,
    position:[-4.7,.015,1.5],
    rotationY:0
  });
  root.add(floorPatch);

  return runtimeLayer(detailGroups,(t)=>{
    pipes.rotation.y=Math.sin(t*.05)*.003;
  });
}

function createAnimal(THREE,root,m,factor){
  const detailGroups=[];

  const mud=createIrregularPatches(THREE,{
    material:m.soil,
    count:Math.max(5,Math.round(15*factor)),
    center:[-2.5,2.0],
    spread:[7.0,5.2],
    seed:402
  });
  root.add(mud);
  detailGroups.push(mud);

  const feedApron=createPatch(THREE,{
    material:m.concrete,
    width:5.2,
    depth:1.8,
    position:[1.8,.018,3.25],
    rotationY:0
  });
  root.add(feedApron);

  const troughRail=createFenceLine(THREE,{
    material:m.wood,
    length:5.6,
    posts:10
  });
  troughRail.position.set(1.8,.03,2.25);
  root.add(troughRail);
  detailGroups.push(troughRail);

  const hoof=createHoofTrack(THREE,{
    material:m.soil,
    count:Math.max(10,Math.round(34*factor))
  });
  root.add(hoof);
  detailGroups.push(hoof);

  const grass=createEdgeGrass(THREE,{
    material:m.vegetation,
    count:Math.max(20,Math.round(80*factor)),
    area:[-9.5,9.5,-7.2,7.2],
    seed:552
  });
  root.add(grass);
  detailGroups.push(grass);

  return runtimeLayer(detailGroups,()=>{});
}

function createTourism(THREE,root,m,factor){
  const detailGroups=[];

  const trail=createTrailSurface(THREE,{
    material:m.soil,
    count:Math.max(9,Math.round(18*factor))
  });
  root.add(trail);
  detailGroups.push(trail);

  const stones=createSteppingStones(THREE,{
    material:m.stone,
    count:Math.max(8,Math.round(20*factor))
  });
  root.add(stones);
  detailGroups.push(stones);

  const boardwalk=createBoardwalk(THREE,{
    material:m.wood,
    count:Math.max(8,Math.round(17*factor))
  });
  boardwalk.position.set(-4.9,.055,-1.1);
  boardwalk.rotation.y=.08;
  root.add(boardwalk);
  detailGroups.push(boardwalk);

  const undergrowth=createEdgeGrass(THREE,{
    material:m.vegetation,
    count:Math.max(28,Math.round(115*factor)),
    area:[-10,10,-7.5,7.5],
    seed:820
  });
  root.add(undergrowth);
  detailGroups.push(undergrowth);

  const rope=createRopeBarrier(THREE,{
    wood:m.wood,
    count:Math.max(6,Math.round(12*factor))
  });
  root.add(rope);
  detailGroups.push(rope);

  return runtimeLayer(detailGroups,(t)=>{
    boardwalk.position.y=.055+Math.sin(t*.15)*.0015;
  });
}

function runtimeLayer(groups,updateFn){
  return{
    update:(t,runtime=1)=>{
      const factor=Math.max(.25,Math.min(1,Number(runtime||1)));
      groups.forEach(group=>{
        if(group.userData?.maxCount && group.isInstancedMesh){
          group.count=Math.max(1,Math.round(group.userData.maxCount*factor));
        }else if(group.children?.length){
          const max=group.children.length;
          group.children.forEach((child,i)=>{
            child.visible=i<Math.max(1,Math.round(max*factor));
          });
        }
      });
      updateFn?.(t,factor);
    },
    setRuntime:()=>{},
    dispose:()=>{}
  };
}

function createPatch(THREE,{material,width,depth,position,rotationY=0}){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),material);
  mesh.rotation.x=-Math.PI/2;
  mesh.rotation.z=rotationY;
  mesh.position.set(...position);
  mesh.receiveShadow=true;
  return mesh;
}

function createFieldLines(THREE,{material,count,length,spacing}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const row=new THREE.Mesh(
      new THREE.BoxGeometry(length,.05,.09),
      material
    );
    row.position.set(0,.035,(i-(count-1)/2)*spacing);
    row.castShadow=true;
    row.receiveShadow=true;
    group.add(row);
  }
  return group;
}

function createScatter(THREE,{material,count,geometry,area,y,scale,seed}){
  const rand=seeded(seed);
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
    dummy.position.set(
      lerp(area[0],area[1],rand()),
      y,
      lerp(area[2],area[3],rand())
    );
    const s=lerp(scale[0],scale[1],rand());
    dummy.scale.set(s,.55*s,s);
    dummy.rotation.set(rand()*1.2,rand()*Math.PI,rand()*.8);
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.userData.maxCount=count;
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  return mesh;
}

function createEdgeGrass(THREE,{material,count,area,seed}){
  const rand=seeded(seed);
  const geo=new THREE.ConeGeometry(.04,.30,4);
  const mesh=new THREE.InstancedMesh(geo,material,count);
  const dummy=new THREE.Object3D();

  for(let i=0;i<count;i++){
    let x=lerp(area[0],area[1],rand());
    let z=lerp(area[2],area[3],rand());
    if(Math.abs(x)<4.5 && Math.abs(z)<3.2){
      x+=Math.sign(x||1)*(3.5+rand()*2);
      z+=Math.sign(z||1)*(2.5+rand()*1.5);
    }
    dummy.position.set(x,.14,z);
    const s=.65+rand()*1.2;
    dummy.scale.set(s,s,s);
    dummy.rotation.y=rand()*Math.PI;
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.userData.maxCount=count;
  mesh.castShadow=true;
  return mesh;
}

function createCulvert(THREE,metal,ground){
  const group=new THREE.Group();
  const pipe=new THREE.Mesh(
    new THREE.CylinderGeometry(.30,.30,1.65,14,1,true),
    metal
  );
  pipe.rotation.z=Math.PI/2;
  pipe.position.y=.30;
  const base=new THREE.Mesh(
    new THREE.BoxGeometry(2.0,.16,1.25),
    ground
  );
  base.position.y=.04;
  group.add(base,pipe);
  return group;
}

function createSafetyLanes(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const stripe=new THREE.Mesh(
      new THREE.BoxGeometry(.15,.015,5.8),
      material
    );
    stripe.position.set(-6.5+i*1.65,.018,0);
    group.add(stripe);
  }
  return group;
}

function createDrainLine(THREE,{metal,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const grate=new THREE.Mesh(
      new THREE.BoxGeometry(.48,.025,.22),
      metal
    );
    grate.position.set(-2.6+i*.53,0,0);
    group.add(grate);
  }
  return group;
}

function createBollards(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const b=new THREE.Mesh(
      new THREE.CylinderGeometry(.07,.08,.72,10),
      material
    );
    const side=i%2===0?-1:1;
    b.position.set(side*5.7,.36,-4.7+Math.floor(i/2)*1.4);
    b.castShadow=true;
    group.add(b);
  }
  return group;
}

function createPipeRack(THREE,{metal,density}){
  const group=new THREE.Group();
  const count=Math.max(2,Math.round(5*density));
  for(let i=0;i<count;i++){
    const pipe=new THREE.Mesh(
      new THREE.CylinderGeometry(.045,.045,13.5,8),
      metal
    );
    pipe.rotation.z=Math.PI/2;
    pipe.position.set(0,i*.18,0);
    group.add(pipe);
  }
  return group;
}

function createRubberMats(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const mat=new THREE.Mesh(
      new THREE.BoxGeometry(1.1,.025,.72),
      material
    );
    mat.position.set(-4.8+i*1.75,.024,4.4);
    group.add(mat);
  }
  return group;
}

function createIrregularPatches(THREE,{material,count,center,spread,seed}){
  const rand=seeded(seed);
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const mesh=new THREE.Mesh(
      new THREE.CircleGeometry(.45+rand()*.75,10),
      material
    );
    mesh.rotation.x=-Math.PI/2;
    mesh.rotation.z=rand()*Math.PI;
    mesh.scale.set(1+rand()*1.5,.55+rand()*.65,1);
    mesh.position.set(
      center[0]+(rand()-.5)*spread[0],
      .019,
      center[1]+(rand()-.5)*spread[1]
    );
    group.add(mesh);
  }
  return group;
}

function createFenceLine(THREE,{material,length,posts}){
  const group=new THREE.Group();
  for(let i=0;i<posts;i++){
    const post=new THREE.Mesh(
      new THREE.BoxGeometry(.07,.72,.07),
      material
    );
    post.position.set(-length/2+i*(length/(posts-1)),.36,0);
    group.add(post);
  }
  for(const y of [.27,.54]){
    const rail=new THREE.Mesh(
      new THREE.BoxGeometry(length,.055,.055),
      material
    );
    rail.position.y=y;
    group.add(rail);
  }
  return group;
}

function createHoofTrack(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const mark=new THREE.Mesh(
      new THREE.RingGeometry(.055,.10,8,1,0,Math.PI*1.5),
      material
    );
    mark.rotation.x=-Math.PI/2;
    mark.rotation.z=(i%4)*.8;
    mark.position.set(
      -5.5+i*(10.6/Math.max(1,count-1)),
      .024,
      5.1+Math.sin(i*.58)*.55
    );
    group.add(mark);
  }
  return group;
}

function createTrailSurface(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const seg=new THREE.Mesh(
      new THREE.PlaneGeometry(.9,.46),
      material
    );
    seg.rotation.x=-Math.PI/2;
    seg.rotation.z=-Math.cos(i*.62)*.42;
    seg.position.set(
      -6+i*(11/Math.max(1,count-1)),
      .018,
      3+Math.sin(i*.62)*1.8
    );
    group.add(seg);
  }
  return group;
}

function createSteppingStones(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const stone=new THREE.Mesh(
      new THREE.CylinderGeometry(.24,.31,.055,8),
      material
    );
    stone.position.set(
      -6.2+i*(6.0/Math.max(1,count-1)),
      .045,
      .55+Math.sin(i*.64)*.42
    );
    stone.rotation.y=i*.37;
    stone.castShadow=true;
    stone.receiveShadow=true;
    group.add(stone);
  }
  return group;
}

function createBoardwalk(THREE,{material,count}){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const plank=new THREE.Mesh(
      new THREE.BoxGeometry(.68,.055,.14),
      material
    );
    plank.position.set(
      i*.38,
      0,
      Math.sin(i*.28)*.08
    );
    plank.rotation.y=.02*Math.sin(i);
    plank.castShadow=true;
    plank.receiveShadow=true;
    group.add(plank);
  }
  return group;
}

function createRopeBarrier(THREE,{wood,count}){
  const group=new THREE.Group();
  const postMat=wood;
  const ropeMat=new THREE.MeshStandardMaterial({
    color:0x806c4f,roughness:1
  });
  const points=[];

  for(let i=0;i<count;i++){
    const x=-5.8+i*(10.2/Math.max(1,count-1));
    const z=5.6+Math.sin(i*.52)*.45;
    const post=new THREE.Mesh(
      new THREE.CylinderGeometry(.035,.045,.72,7),
      postMat
    );
    post.position.set(x,.36,z);
    group.add(post);
    points.push(new THREE.Vector3(x,.57,z));
  }

  if(points.length>1){
    const line=new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({color:0x7e6949,transparent:true,opacity:.85})
    );
    group.add(line);
  }
  return group;
}

function disposeMaterials(materials){
  for(const [key,material] of Object.entries(materials||{})){
    if(key.startsWith("__")||!material?.isMaterial)continue;
    for(const value of Object.values(material)){
      if(value?.isTexture)value.dispose?.();
    }
    material.dispose?.();
  }
}

function disposeGroup(group){
  group?.traverse?.(object=>{
    object.geometry?.dispose?.();
    // Materials are disposed separately because many meshes share them.
  });
}

function seeded(seed=1){
  let s=seed>>>0;
  return()=>{
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
}

function lerp(a,b,t){return a+(b-a)*t;}
