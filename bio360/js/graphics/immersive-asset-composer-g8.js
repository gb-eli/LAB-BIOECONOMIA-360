export function createImmersiveAssetComposerG8({
  THREE,
  assetScope,
  logger
}){
  const createRoot=(scene,name)=>{
    const root=new THREE.Group();
    root.name=name;
    scene.add(root);
    return root;
  };

  const loadInto=async(root,assetId,{
    position=[0,0,0],
    rotationY=0,
    scale=1,
    clones=[]
  }={})=>{
    try{
      const source=await assetScope.loadAsset(assetId);
      const add=(pos,rot=rotationY,scl=scale)=>{
        const model=source.scene.clone(true);
        model.position.set(...pos);
        model.rotation.y=rot;
        model.scale.setScalar(scl);
        model.traverse(obj=>{
          if(!obj.isMesh)return;
          // Eligible meshes always remain shadow-capable.
          // Renderer/light quality settings gate the real runtime cost.
          obj.castShadow=true;
          obj.receiveShadow=true;
          obj.frustumCulled=true;
        });
        root.add(model);
        return model;
      };

      const primary=add(position);
      const extras=clones.map(item=>add(
        item.position||position,
        item.rotationY??rotationY,
        item.scale??scale
      ));

      return [primary,...extras];
    }catch(error){
      logger?.warn?.(`Asset G8 indisponível: ${assetId}`,error);
      return[];
    }
  };

  const territory=async(scene)=>{
    const root=createRoot(scene,"g8-territory-assets");

    await Promise.all([
      loadInto(root,"shared-info-pedestal",{
        position:[2.0,.02,3.0],
        rotationY:-.4,
        scale:.72
      }),
      loadInto(root,"shared-bio-crate",{
        position:[4.5,.18,1.1],
        scale:.44,
        clones:[
          {position:[4.95,.18,1.08],rotationY:.2,scale:.44},
          {position:[4.72,.52,1.08],rotationY:-.12,scale:.44}
        ]
      })
    ]);

    return simpleHandle(root);
  };

  const agroindustry=async(scene)=>{
    const root=createRoot(scene,"g8-agro-assets");

    await Promise.all([
      loadInto(root,"shared-product-package",{
        position:[3.9,.12,1.85],
        rotationY:.18,
        scale:.62,
        clones:[
          {position:[4.35,.12,1.82],rotationY:-.08,scale:.62},
          {position:[4.14,.47,1.82],rotationY:.12,scale:.62}
        ]
      }),
      loadInto(root,"shared-bio-crate",{
        position:[6.1,.18,4.7],
        rotationY:.1,
        scale:.48,
        clones:[
          {position:[6.65,.18,4.75],rotationY:-.12,scale:.48}
        ]
      })
    ]);

    return simpleHandle(root);
  };

  const animalFarm=async(scene)=>{
    const root=createRoot(scene,"g8-animal-assets");

    await Promise.all([
      loadInto(root,"shared-animal-shelter",{
        position:[-6.4,.02,-4.6],
        rotationY:.18,
        scale:.72
      }),
      loadInto(root,"shared-effluent-treatment",{
        position:[-4.4,.02,4.7],
        rotationY:-.3,
        scale:.72
      })
    ]);

    return simpleHandle(root);
  };

  const tourism=async(scene)=>{
    const root=createRoot(scene,"g8-tourism-assets");

    await Promise.all([
      loadInto(root,"shared-info-pedestal",{
        position:[-1.8,.02,-4.2],
        rotationY:.55,
        scale:.68
      }),
      loadInto(root,"shared-market-kiosk",{
        position:[6.45,.02,2.1],
        rotationY:-.15,
        scale:.72
      })
    ]);

    return simpleHandle(root);
  };

  return{
    territory,
    agroindustry,
    animalFarm,
    tourism
  };
}

function simpleHandle(root){
  return{
    root,
    dispose:()=>root.removeFromParent()
  };
}
