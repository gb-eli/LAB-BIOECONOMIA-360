export function createInteractiveEnvironmentG12({
  THREE,
  scene,
  kind,
  events=null,
  moduleId="immersive"
}){
  const root=new THREE.Group();
  root.name=`interactive-environment-g12-${kind}`;
  scene.add(root);

  const state=new Map();
  const effects=new Map();
  const pulses=[];

  const emit=(actionId,active,meta={})=>{
    events?.emit?.("immersive:environment-action",{
      moduleId,
      actionId,
      active,
      at:new Date().toISOString(),
      ...meta
    });
  };

  const register=(id,effect)=>{
    effects.set(id,effect);
    state.set(id,false);
    effect.root && root.add(effect.root);
    effect.setActive?.(false,{initial:true});
    return effect;
  };

  if(kind==="territory"){
    register("irrigation",createIrrigation(THREE));
    register("water-pump",createPumpFlow(THREE));
    register("field-lights",createFieldBeacons(THREE));
    register("waste-flow",createCircularFlow(THREE));
  }

  if(kind==="agroindustry"){
    register("receiving",createReceivingDock(THREE));
    register("washing",createWashSystem(THREE));
    register("processing",createProcessingSystem(THREE));
    register("filling",createFillingSystem(THREE));
    register("cold-storage",createColdStorageSystem(THREE));
    register("residue-route",createResidueRoute(THREE));
  }

  if(kind==="animal"){
    register("shelter-fans",createShelterFans(THREE));
    register("water-flow",createAnimalWaterFlow(THREE));
    register("effluent-aeration",createEffluentAeration(THREE));
    register("feed-line",createFeedLine(THREE));
  }

  if(kind==="tourism"){
    register("entry-gate",createEntryGate(THREE));
    register("trail-guidance",createTrailGuidance(THREE));
    register("lagoon-sample",createLagoonSample(THREE));
    register("lookout-beacon",createLookoutBeacon(THREE));
    register("visitor-center",createVisitorCenterSignal(THREE));
  }

  const activate=(id,{toggle=false,duration=0,meta={}}={})=>{
    const effect=effects.get(id);
    if(!effect)return false;

    const next=toggle?!state.get(id):true;
    state.set(id,next);
    effect.setActive?.(next,{initial:false});
    emit(id,next,meta);

    if(next){
      pulses.push({
        id,
        startedAt:performance.now(),
        until:performance.now()+1400
      });
    }

    if(next && duration>0){
      setTimeout(()=>{
        if(state.get(id)){
          state.set(id,false);
          effect.setActive?.(false,{initial:false});
          emit(id,false,{...meta,reason:"duration"});
        }
      },duration);
    }

    return next;
  };

  const deactivate=id=>{
    const effect=effects.get(id);
    if(!effect)return false;
    state.set(id,false);
    effect.setActive?.(false,{initial:false});
    emit(id,false);
    return true;
  };

  const update=(t,runtime=1)=>{
    const factor=Math.max(.25,Math.min(1,Number(runtime||1)));
    effects.forEach((effect,id)=>{
      effect.update?.(t,{
        active:Boolean(state.get(id)),
        runtime:factor
      });
    });

    const now=performance.now();
    for(let i=pulses.length-1;i>=0;i--){
      if(now>=pulses[i].until){
        pulses.splice(i,1);
        continue;
      }
      const effect=effects.get(pulses[i].id);
      effect?.pulse?.((now-pulses[i].startedAt)/1400);
    }
  };

  const dispose=()=>{
    effects.forEach(effect=>effect.dispose?.());
    root.removeFromParent();
    disposeGroup(root);
    state.clear();
    effects.clear();
    pulses.length=0;
  };

  return{
    root,
    activate,
    deactivate,
    isActive:id=>Boolean(state.get(id)),
    list:()=>[...state.entries()].map(([id,active])=>({id,active})),
    update,
    dispose
  };
}

function createIrrigation(THREE){
  const root=new THREE.Group();
  root.position.set(-5.8,.06,3.8);

  const water=new THREE.MeshBasicMaterial({
    color:0x75c9ef,
    transparent:true,
    opacity:.0,
    depthWrite:false
  });

  const jets=[];
  for(let i=0;i<7;i++){
    const jetMaterial=water.clone?.()||new THREE.MeshBasicMaterial({
      color:0x75c9ef,
      transparent:true,
      opacity:.0,
      depthWrite:false
    });
    const jet=new THREE.Mesh(
      new THREE.CylinderGeometry(.018,.032,1.1,6),
      jetMaterial
    );
    jet.rotation.z=Math.PI*.42;
    jet.position.set(-2.4+i*.78,.56,(i%2?-.6:.6));
    jet.visible=false;
    root.add(jet);
    jets.push(jet);
  }

  const wet=new THREE.Mesh(
    new THREE.PlaneGeometry(6.0,3.8),
    new THREE.MeshBasicMaterial({
      color:0x51766a,
      transparent:true,
      opacity:0,
      depthWrite:false
    })
  );
  wet.rotation.x=-Math.PI/2;
  wet.position.y=.012;
  root.add(wet);

  return{
    root,
    setActive(active){
      jets.forEach(j=>j.visible=active);
      wet.material.opacity=active?.16:0;
    },
    update(t,{active,runtime}){
      if(!active)return;
      jets.forEach((jet,i)=>{
        jet.material.opacity=.32+Math.sin(t*5+i)*.08;
        jet.scale.y=.7+Math.sin(t*3+i*.7)*.16;
        jet.visible=i<Math.max(2,Math.round(jets.length*runtime));
      });
      wet.material.opacity=.10+.05*Math.sin(t*.7);
    },
    pulse(u){
      root.scale.setScalar(1+Math.sin(u*Math.PI)*.03);
    }
  };
}

function createPumpFlow(THREE){
  const root=new THREE.Group();
  root.position.set(-8.7,.1,2.7);

  const stream=new THREE.Mesh(
    new THREE.CylinderGeometry(.03,.045,2.2,8),
    new THREE.MeshBasicMaterial({
      color:0x6fcff2,
      transparent:true,
      opacity:0,
      depthWrite:false
    })
  );
  stream.rotation.z=Math.PI/2;
  stream.position.set(1.0,.42,.1);
  root.add(stream);

  const splash=new THREE.Mesh(
    new THREE.RingGeometry(.20,.32,20),
    new THREE.MeshBasicMaterial({
      color:0x82d9f7,
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide,
      depthWrite:false
    })
  );
  splash.rotation.x=-Math.PI/2;
  splash.position.set(2.05,.02,.1);
  root.add(splash);

  return{
    root,
    setActive(active){
      stream.material.opacity=active?.56:0;
      splash.material.opacity=active?.42:0;
    },
    update(t,{active}){
      if(!active)return;
      splash.scale.setScalar(.85+(Math.sin(t*4)+1)*.2);
      stream.material.opacity=.48+Math.sin(t*7)*.08;
    }
  };
}

function createFieldBeacons(THREE){
  const root=new THREE.Group();
  const lights=[];
  for(let i=0;i<8;i++){
    const light=new THREE.Mesh(
      new THREE.SphereGeometry(.055,8,6),
      new THREE.MeshStandardMaterial({
        color:0xe4c96d,
        emissive:0xe4a94d,
        emissiveIntensity:0
      })
    );
    light.position.set(-8.2+i*.7,.26,5.8);
    root.add(light);
    lights.push(light);
  }
  return{
    root,
    setActive(active){
      lights.forEach(l=>l.material.emissiveIntensity=active?1.2:0);
    },
    update(t,{active,runtime}){
      lights.forEach((l,i)=>{
        l.visible=i<Math.max(3,Math.round(lights.length*runtime));
        if(active)l.material.emissiveIntensity=.7+(Math.sin(t*3+i*.7)+1)*.35;
      });
    }
  };
}

function createCircularFlow(THREE){
  const root=new THREE.Group();
  root.position.set(6.9,.15,5.0);
  const nodes=[];
  for(let i=0;i<10;i++){
    const n=new THREE.Mesh(
      new THREE.SphereGeometry(.055,7,5),
      new THREE.MeshBasicMaterial({
        color:0x7bd8aa,
        transparent:true,
        opacity:0
      })
    );
    root.add(n);
    nodes.push(n);
  }
  return{
    root,
    setActive(active){
      nodes.forEach(n=>n.material.opacity=active?.65:0);
    },
    update(t,{active,runtime}){
      nodes.forEach((n,i)=>{
        const a=t*.85+i/nodes.length*Math.PI*2;
        n.position.set(Math.cos(a)*1.05,.28+Math.sin(a*2)*.14,Math.sin(a)*.72);
        n.visible=active && i<Math.max(4,Math.round(nodes.length*runtime));
      });
    }
  };
}

function createReceivingDock(THREE){
  const root=new THREE.Group();
  root.position.set(-5.8,.1,1.9);
  const boxes=[];
  for(let i=0;i<6;i++){
    const box=new THREE.Mesh(
      new THREE.BoxGeometry(.34,.25,.28),
      new THREE.MeshStandardMaterial({color:0xa77b4e,roughness:.85})
    );
    box.position.set(-1.4+i*.48,.17,0);
    root.add(box);
    boxes.push(box);
  }
  return{
    root,
    setActive(active){root.visible=active;},
    update(t,{active}){
      if(!active)return;
      boxes.forEach((b,i)=>{
        b.position.x=-1.4+((i*.48+t*.55)%2.9);
      });
    }
  };
}

function createWashSystem(THREE){
  const root=new THREE.Group();
  root.position.set(-3.4,.2,-.2);
  const drops=[];
  for(let i=0;i<14;i++){
    const d=new THREE.Mesh(
      new THREE.SphereGeometry(.028,6,4),
      new THREE.MeshBasicMaterial({
        color:0x84d8ff,
        transparent:true,
        opacity:0
      })
    );
    root.add(d);
    drops.push(d);
  }
  return{
    root,
    setActive(active){drops.forEach(d=>d.material.opacity=active?.55:0);},
    update(t,{active,runtime}){
      drops.forEach((d,i)=>{
        const p=(t*.9+i/drops.length)%1;
        d.position.set(
          -1.0+(i%7)*.32,
          1.45-p*1.25,
          -.45+(i%3)*.45
        );
        d.visible=active && i<Math.max(5,Math.round(drops.length*runtime));
      });
    }
  };
}

function createProcessingSystem(THREE){
  const root=new THREE.Group();
  root.position.set(.7,.3,.0);
  const rotor=new THREE.Mesh(
    new THREE.TorusGeometry(.58,.06,8,24),
    new THREE.MeshStandardMaterial({
      color:0xb2bcb8,
      metalness:.45,
      roughness:.42,
      emissive:0x5bc393,
      emissiveIntensity:0
    })
  );
  rotor.rotation.x=Math.PI/2;
  root.add(rotor);

  return{
    root,
    setActive(active){rotor.material.emissiveIntensity=active?.45:0;},
    update(t,{active}){if(active)rotor.rotation.z=t*2.2;},
    pulse(u){root.scale.setScalar(1+Math.sin(u*Math.PI)*.08);}
  };
}

function createFillingSystem(THREE){
  const root=new THREE.Group();
  root.position.set(4.3,.1,.3);
  const packs=[];
  for(let i=0;i<7;i++){
    const p=new THREE.Mesh(
      new THREE.BoxGeometry(.16,.28,.13),
      new THREE.MeshStandardMaterial({color:0xc8a455,roughness:.66})
    );
    root.add(p);
    packs.push(p);
  }
  return{
    root,
    setActive(active){root.visible=active;},
    update(t,{active,runtime}){
      packs.forEach((p,i)=>{
        p.position.set(-1.1+((i*.34+t*.6)%2.4),.14,0);
        p.visible=active && i<Math.max(3,Math.round(packs.length*runtime));
      });
    }
  };
}

function createColdStorageSystem(THREE){
  const root=new THREE.Group();
  root.position.set(5.9,.5,-3.8);
  const fan=new THREE.Mesh(
    new THREE.TorusGeometry(.36,.04,7,22),
    new THREE.MeshStandardMaterial({color:0x92a7a3,metalness:.3,roughness:.5})
  );
  root.add(fan);

  const mist=[];
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(
      new THREE.SphereGeometry(.07,6,4),
      new THREE.MeshBasicMaterial({
        color:0xd8eef1,
        transparent:true,
        opacity:0,
        depthWrite:false
      })
    );
    root.add(m);
    mist.push(m);
  }

  return{
    root,
    setActive(active){mist.forEach(m=>m.material.opacity=active?.12:0);},
    update(t,{active,runtime}){
      if(active)fan.rotation.z=t*3.4;
      mist.forEach((m,i)=>{
        const p=(t*.22+i/mist.length)%1;
        m.position.set((i%5)*.17-.34,.1+p*.7,(i%3)*.16-.16);
        m.scale.setScalar(.5+p*.9);
        m.visible=active && i<Math.max(4,Math.round(mist.length*runtime));
      });
    }
  };
}

function createResidueRoute(THREE){
  const root=new THREE.Group();
  root.position.set(7,.1,4.2);
  const particles=[];
  for(let i=0;i<12;i++){
    const p=new THREE.Mesh(
      new THREE.SphereGeometry(.045,6,4),
      new THREE.MeshBasicMaterial({
        color:0x8fbd6f,
        transparent:true,
        opacity:0
      })
    );
    root.add(p);
    particles.push(p);
  }
  return{
    root,
    setActive(active){particles.forEach(p=>p.material.opacity=active?.55:0);},
    update(t,{active,runtime}){
      particles.forEach((p,i)=>{
        const phase=(i/particles.length+t*.4)%1;
        p.position.set(-1+phase*2,.25+Math.sin(phase*Math.PI)*.6,Math.sin(phase*Math.PI*2)*.22);
        p.visible=active && i<Math.max(4,Math.round(particles.length*runtime));
      });
    }
  };
}

function createShelterFans(THREE){
  const root=new THREE.Group();
  root.position.set(-6.15,1.55,-4.0);
  const fans=[];
  for(let i=0;i<3;i++){
    const fan=new THREE.Mesh(
      new THREE.TorusGeometry(.26,.035,7,20),
      new THREE.MeshStandardMaterial({
        color:0x899895,
        metalness:.3,
        roughness:.5
      })
    );
    fan.position.x=(i-1)*.8;
    root.add(fan);
    fans.push(fan);
  }
  return{
    root,
    setActive(active){root.visible=active;},
    update(t,{active}){if(active)fans.forEach((f,i)=>f.rotation.z=t*(2.5+i*.2));}
  };
}

function createAnimalWaterFlow(THREE){
  const root=new THREE.Group();
  root.position.set(3.0,.1,-3.25);
  const flow=new THREE.Mesh(
    new THREE.CylinderGeometry(.025,.04,1.3,8),
    new THREE.MeshBasicMaterial({
      color:0x6ecdf0,
      transparent:true,
      opacity:0
    })
  );
  flow.rotation.z=Math.PI/2;
  flow.position.set(.5,.45,0);
  root.add(flow);

  const ripple=new THREE.Mesh(
    new THREE.RingGeometry(.2,.33,22),
    new THREE.MeshBasicMaterial({
      color:0x88d8f4,
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide
    })
  );
  ripple.rotation.x=-Math.PI/2;
  ripple.position.set(1.15,.02,0);
  root.add(ripple);

  return{
    root,
    setActive(active){
      flow.material.opacity=active?.55:0;
      ripple.material.opacity=active?.38:0;
    },
    update(t,{active}){
      if(!active)return;
      ripple.scale.setScalar(.85+(Math.sin(t*4)+1)*.22);
    }
  };
}

function createEffluentAeration(THREE){
  const root=new THREE.Group();
  root.position.set(-4.4,.05,4.7);
  const bubbles=[];
  for(let i=0;i<18;i++){
    const b=new THREE.Mesh(
      new THREE.SphereGeometry(.035,6,4),
      new THREE.MeshBasicMaterial({
        color:0xbce9f4,
        transparent:true,
        opacity:0
      })
    );
    root.add(b);
    bubbles.push(b);
  }
  return{
    root,
    setActive(active){bubbles.forEach(b=>b.material.opacity=active?.45:0);},
    update(t,{active,runtime}){
      bubbles.forEach((b,i)=>{
        const p=(t*.5+i/bubbles.length)%1;
        b.position.set(
          -1+(i%6)*.38,
          .05+p*.8,
          -.4+(i%3)*.4
        );
        b.visible=active && i<Math.max(5,Math.round(bubbles.length*runtime));
      });
    }
  };
}

function createFeedLine(THREE){
  const root=new THREE.Group();
  root.position.set(1.8,.1,3.2);
  const feed=[];
  for(let i=0;i<18;i++){
    const f=new THREE.Mesh(
      new THREE.SphereGeometry(.035,5,4),
      new THREE.MeshStandardMaterial({color:0x9d773e,roughness:1})
    );
    f.position.set(-2.1+i*.25,.12,0);
    root.add(f);
    feed.push(f);
  }
  return{
    root,
    setActive(active){root.visible=active;},
    update(t,{active,runtime}){
      feed.forEach((f,i)=>{
        f.visible=active && i<Math.max(6,Math.round(feed.length*runtime));
        if(active)f.position.z=Math.sin(t*2+i*.4)*.035;
      });
    }
  };
}

function createEntryGate(THREE){
  const root=new THREE.Group();
  root.position.set(-6.8,.7,3.5);
  const arm=new THREE.Mesh(
    new THREE.BoxGeometry(1.5,.08,.09),
    new THREE.MeshStandardMaterial({color:0x6f925e,roughness:.78})
  );
  arm.position.x=.72;
  root.add(arm);
  return{
    root,
    setActive(active){
      root.userData.target=active?-1.15:0;
    },
    update(t,{active}){
      const target=root.userData.target||0;
      arm.rotation.z+=(target-arm.rotation.z)*.08;
    }
  };
}

function createTrailGuidance(THREE){
  const root=new THREE.Group();
  const lights=[];
  for(let i=0;i<10;i++){
    const l=new THREE.Mesh(
      new THREE.SphereGeometry(.045,7,5),
      new THREE.MeshStandardMaterial({
        color:0xaadf8e,
        emissive:0x70c96f,
        emissiveIntensity:0
      })
    );
    l.position.set(-4.8+i*.92,.18,3+Math.sin(i*.65)*1.7);
    root.add(l);
    lights.push(l);
  }
  return{
    root,
    setActive(active){
      lights.forEach(l=>l.material.emissiveIntensity=active?.8:0);
    },
    update(t,{active,runtime}){
      lights.forEach((l,i)=>{
        l.visible=i<Math.max(4,Math.round(lights.length*runtime));
        if(active)l.material.emissiveIntensity=.4+(Math.sin(t*3-i*.45)+1)*.38;
      });
    }
  };
}

function createLagoonSample(THREE){
  const root=new THREE.Group();
  root.position.set(-5,.08,-3);
  const buoy=new THREE.Mesh(
    new THREE.CylinderGeometry(.10,.14,.42,10),
    new THREE.MeshStandardMaterial({
      color:0xe1b85d,
      emissive:0x9d7a25,
      emissiveIntensity:.15
    })
  );
  buoy.position.y=.22;
  root.add(buoy);

  const ripple=new THREE.Mesh(
    new THREE.RingGeometry(.25,.38,22),
    new THREE.MeshBasicMaterial({
      color:0xbde6f1,
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide
    })
  );
  ripple.rotation.x=-Math.PI/2;
  root.add(ripple);

  return{
    root,
    setActive(active){ripple.material.opacity=active?.42:0;},
    update(t,{active}){
      if(active){
        buoy.position.y=.22+Math.sin(t*2.2)*.045;
        ripple.scale.setScalar(.9+(Math.sin(t*3)+1)*.28);
      }
    }
  };
}

function createLookoutBeacon(THREE){
  const root=new THREE.Group();
  root.position.set(-1,.15,-5);
  const beam=new THREE.Mesh(
    new THREE.ConeGeometry(.18,1.6,10,1,true),
    new THREE.MeshBasicMaterial({
      color:0xe2d27d,
      transparent:true,
      opacity:0,
      depthWrite:false
    })
  );
  beam.position.y=.82;
  root.add(beam);
  return{
    root,
    setActive(active){beam.material.opacity=active?.16:0;},
    update(t,{active}){if(active)root.rotation.y=t*.35;}
  };
}

function createVisitorCenterSignal(THREE){
  const root=new THREE.Group();
  root.position.set(5.0,.8,-3);
  const screen=new THREE.Mesh(
    new THREE.BoxGeometry(.85,.46,.06),
    new THREE.MeshStandardMaterial({
      color:0x345549,
      emissive:0x59b88c,
      emissiveIntensity:0
    })
  );
  root.add(screen);

  return{
    root,
    setActive(active){screen.material.emissiveIntensity=active?1.1:0;},
    update(t,{active}){if(active)screen.material.emissiveIntensity=.7+(Math.sin(t*2)+1)*.25;}
  };
}

function disposeGroup(group){
  group?.traverse?.(object=>{
    object.geometry?.dispose?.();
    if(Array.isArray(object.material))object.material.forEach(m=>m?.dispose?.());
    else object.material?.dispose?.();
  });
}
