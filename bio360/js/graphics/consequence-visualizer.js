export function createConsequenceVisualizer(THREE){
  const territory=({scene,consequences,river,cropRows=[],profile})=>{
    const water=delta(consequences,"production.waterAccess");
    const supply=delta(consequences,"production.supplyIndex");
    const records=consequences.targetSummary("production").records;

    if(river?.material){
      river.material=river.material.clone();
      river.material.opacity=clamp(.78+water/110,.28,.88);
      river.scale.x=clamp(1+water/90,.48,1.18);
    }

    for(const row of cropRows){
      row.material=row.material.clone();
      if(supply<0){
        row.material.color.offsetHSL(.04,-.12,Math.max(-.22,supply/260));
        row.scale.y=clamp(1+supply/120,.45,1);
      }else if(supply>0){
        row.material.color.offsetHSL(-.01,.04,.04);
        row.scale.y=clamp(1+supply/160,1,1.28);
      }
    }

    const effectGroup=new THREE.Group();
    effectGroup.name="territory-consequence-effects";

    if(water<0){
      const count=Math.min(18,Math.max(5,Math.round(Math.abs(water)*.75)));
      const mat=new THREE.MeshBasicMaterial({
        color:0xc89c62,
        transparent:true,
        opacity:profile?.rank>=2?.20:.12,
        depthWrite:false
      });
      for(let i=0;i<count;i++){
        const patch=new THREE.Mesh(new THREE.CircleGeometry(.25+(i%4)*.08,12),mat);
        patch.rotation.x=-Math.PI/2;
        patch.position.set(-9+(i%6)*2.8,.018,-6+Math.floor(i/6)*4.2);
        patch.scale.x=1.5;
        effectGroup.add(patch);
      }
    }

    const beaconMat=new THREE.MeshBasicMaterial({
      color:water<0?0xe6b151:supply<0?0xd97c65:0x57d6a3,
      transparent:true,
      opacity:.38
    });
    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),beaconMat);
    beacon.position.set(-1.1,2.2,0);
    effectGroup.add(beacon);
    scene.add(effectGroup);

    return {
      group:effectGroup,
      summary:{
        count:records.length,
        water:Math.round(water),
        supply:Math.round(supply),
        labels:[...new Set(records.map(item=>item.label))]
      },
      update:t=>{
        beacon.scale.setScalar(1+Math.sin(t*2.2)*.16);
        beacon.material.opacity=.30+Math.sin(t*1.4)*.08;
      }
    };
  };

  const agroindustry=({scene,consequences,stationMeshes,profile})=>{
    const quality=delta(consequences,"processing.qualityIndex");
    const packaging=delta(consequences,"processing.packagingReadiness");
    const records=consequences.targetSummary("processing").records;

    const group=new THREE.Group();
    group.name="agro-consequence-effects";

    const color=quality<0?0xdd765f:packaging<0?0xe6b151:0x57d6a3;
    const light=new THREE.PointLight(color,profile?.rank>=2?1.5:.8,7,2);
    light.position.set(.1,2.6,-1.4);
    group.add(light);

    const beacon=new THREE.Mesh(
      new THREE.CylinderGeometry(.12,.12,.20,16),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7})
    );
    beacon.position.set(.1,2.8,-1.4);
    group.add(beacon);

    if(quality<0){
      for(const id of ["processo","conservacao"]){
        stationMeshes.get(id)?.traverse(obj=>{
          if(!obj.isMesh||!obj.material?.clone)return;
          obj.material=obj.material.clone();
          obj.material.emissive?.setHex?.(0x5a160e);
          obj.material.emissiveIntensity=.16;
        });
      }
    }

    if(packaging<0){
      stationMeshes.get("embalagem")?.traverse(obj=>{
        if(!obj.isMesh||!obj.material?.clone)return;
        obj.material=obj.material.clone();
        obj.material.emissive?.setHex?.(0x5a4610);
        obj.material.emissiveIntensity=.16;
      });
    }

    scene.add(group);

    return {
      group,
      summary:{
        count:records.length,
        quality:Math.round(quality),
        packaging:Math.round(packaging),
        labels:[...new Set(records.map(item=>item.label))]
      },
      update:t=>{
        light.intensity=(profile?.rank>=2?1.25:.72)+(Math.sin(t*3.1)+1)*.18;
        beacon.rotation.y=t*.8;
      }
    };
  };

  return {territory,agroindustry};
}

function delta(consequences,key){
  return consequences.resolve(0,key,{min:-100,max:100});
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
