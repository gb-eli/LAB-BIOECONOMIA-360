export function createInstancedObjectFactory(THREE){
  const createMemberRing=(scene,{
    maxCount=32,
    radius=3.15,
    activeColor=0x66d3a2,
    inactiveColor=0x77837d
  }={})=>{
    const geometry=new THREE.SphereGeometry(.16,8,6);
    const material=new THREE.MeshStandardMaterial({
      color:0xffffff,
      roughness:.76,
      vertexColors:true
    });
    const mesh=new THREE.InstancedMesh(geometry,material,maxCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count=0;
    mesh.castShadow=false;
    mesh.receiveShadow=true;

    const dummy=new THREE.Object3D();
    const color=new THREE.Color();

    const update=({count=0,participation=50,rotation=0}={})=>{
      const visible=Math.max(0,Math.min(maxCount,Math.round(count)));
      mesh.count=visible;
      const activeRatio=Math.max(0,Math.min(1,Number(participation||0)/100));

      for(let i=0;i<visible;i++){
        const angle=i/Math.max(1,visible)*Math.PI*2+rotation;
        dummy.position.set(Math.cos(angle)*radius,.62,Math.sin(angle)*radius);
        dummy.rotation.set(0,-angle,0);
        dummy.scale.setScalar(.88+((i*17)%9)/50);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);

        color.setHex(i/Math.max(1,visible)<activeRatio?activeColor:inactiveColor);
        mesh.setColorAt(i,color);
      }
      mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      return visible;
    };

    scene.add(mesh);
    return{
      mesh,
      update,
      dispose:()=>{
        scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      }
    };
  };

  const createPackageDisplay=(scene,{
    maxCount=24,
    center=[2.2,.72,0],
    width=2.2,
    rows=3
  }={})=>{
    const geometry=new THREE.BoxGeometry(.22,.34,.18);
    const material=new THREE.MeshStandardMaterial({
      color:0xd0aa72,
      roughness:.76,
      metalness:.02,
      vertexColors:true
    });
    const mesh=new THREE.InstancedMesh(geometry,material,maxCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count=0;
    mesh.castShadow=true;
    mesh.receiveShadow=true;

    const dummy=new THREE.Object3D();
    const color=new THREE.Color();

    const update=({
      count=12,
      sustainability=50,
      proof=50,
      runtimeFactor=1
    }={})=>{
      const requested=Math.round(Number(count||0)*Math.max(.35,Number(runtimeFactor||1)));
      const visible=Math.max(0,Math.min(maxCount,requested));
      mesh.count=visible;

      const columns=Math.max(1,Math.ceil(maxCount/rows));
      const step=width/Math.max(1,columns-1);
      const eco=Math.max(0,Math.min(1,Number(sustainability||0)/100));
      const verified=Math.max(0,Math.min(1,Number(proof||0)/100));

      for(let i=0;i<visible;i++){
        const row=i%rows;
        const col=Math.floor(i/rows);
        dummy.position.set(
          center[0]-width/2+col*step,
          center[1]+row*.39,
          center[2]+(row-1)*.18
        );
        dummy.rotation.set(0,(col%2?-.06:.06),0);
        dummy.scale.set(
          .9+eco*.12,
          .86+verified*.15,
          .9
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);

        color.setHSL(.09+eco*.19,.38+.22*verified,.54+.08*eco);
        mesh.setColorAt(i,color);
      }

      mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      return visible;
    };

    scene.add(mesh);
    return{
      mesh,
      update,
      dispose:()=>{
        scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      }
    };
  };

  const createTrailMarkers=(scene,{
    positions=[],
    color=0x7ac99f,
    height=.55
  }={})=>{
    const count=Math.max(1,positions.length);
    const geometry=new THREE.CylinderGeometry(.035,.055,height,7);
    const material=new THREE.MeshStandardMaterial({
      color,
      roughness:.82,
      metalness:.06
    });
    const mesh=new THREE.InstancedMesh(geometry,material,count);
    mesh.castShadow=false;
    mesh.receiveShadow=true;

    const dummy=new THREE.Object3D();
    positions.forEach((p,i)=>{
      dummy.position.set(Number(p[0]||0),height/2,Number(p[1]||0));
      dummy.rotation.y=(i*.47)%Math.PI;
      dummy.scale.setScalar(.9+((i*13)%7)/35);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);

    return{
      mesh,
      setVisibleFactor:f=>{
        mesh.count=Math.max(1,Math.min(count,Math.round(count*Math.max(.2,Number(f||1)))));
      },
      dispose:()=>{
        scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      }
    };
  };

  const createChainBeacons=(scene,{
    positions=[],
    active=[],
    colorOn=0x57d6a3,
    colorOff=0x59645f
  }={})=>{
    const count=Math.max(1,positions.length);
    const geometry=new THREE.IcosahedronGeometry(.14,1);
    const material=new THREE.MeshStandardMaterial({
      color:0xffffff,
      roughness:.55,
      emissive:0x14231d,
      vertexColors:true
    });
    const mesh=new THREE.InstancedMesh(geometry,material,count);
    const dummy=new THREE.Object3D();
    const c=new THREE.Color();

    positions.forEach((p,i)=>{
      dummy.position.set(Number(p[0]||0),1.22,Number(p[2]||0));
      dummy.scale.setScalar(active[i]?.8:.58);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      c.setHex(active[i]?colorOn:colorOff);
      mesh.setColorAt(i,c);
    });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    scene.add(mesh);

    return{
      mesh,
      update:t=>{
        mesh.rotation.y=Math.sin(t*.65)*.035;
        mesh.position.y=.04+Math.sin(t*1.15)*.025;
      },
      dispose:()=>{
        scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      }
    };
  };

  return{
    createMemberRing,
    createPackageDisplay,
    createTrailMarkers,
    createChainBeacons
  };
}
