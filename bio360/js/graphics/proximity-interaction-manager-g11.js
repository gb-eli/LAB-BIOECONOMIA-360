export class ProximityInteractionManagerG11{
  constructor({
    THREE,
    camera,
    container,
    walkExplorer,
    points=[],
    eventBus=null,
    moduleId="immersive",
    storage=null,
    storageKey=null
  }){
    this.THREE=THREE;
    this.camera=camera;
    this.container=container;
    this.walkExplorer=walkExplorer;
    this.eventBus=eventBus;
    this.moduleId=moduleId;
    this.storage=storage;
    this.storageKey=storageKey||`immersive.interactions.${moduleId}`;
    this.points=normalizePoints(points);

    this.root=new THREE.Group();
    this.root.name=`proximity-g11-${moduleId}`;
    this.root.visible=false;

    this.markers=new Map();
    this.nearest=null;
    this.prompt=null;
    this.sheet=null;
    this.activePulse=null;
    this.pulseUntil=0;
    this.disposed=false;
    this.interacted=new Set(storage?.get?.(this.storageKey,[])||[]);

    this._keyDown=e=>{
      if(!this.walkExplorer?.isActive?.())return;
      if(e.code==="KeyE" && this.nearest){
        e.preventDefault();
        this.interact(this.nearest);
      }
    };

    globalThis.addEventListener("keydown",this._keyDown,{passive:false});
    this.buildMarkers();
    this.mountPrompt();
  }

  attachTo(scene){
    if(this.root.parent!==scene)scene.add(this.root);
    return this;
  }

  buildMarkers(){
    const THREE=this.THREE;

    for(const point of this.points){
      const group=new THREE.Group();
      group.position.set(...point.position);
      group.userData.point=point;

      const ring=new THREE.Mesh(
        new THREE.RingGeometry(.23,.34,28),
        new THREE.MeshBasicMaterial({
          color:point.color,
          transparent:true,
          opacity:.32,
          side:THREE.DoubleSide,
          depthWrite:false
        })
      );
      ring.rotation.x=-Math.PI/2;
      ring.position.y=.025;

      const core=new THREE.Mesh(
        new THREE.CylinderGeometry(.045,.065,.42,10),
        new THREE.MeshBasicMaterial({
          color:point.color,
          transparent:true,
          opacity:.42,
          depthWrite:false
        })
      );
      core.position.y=.23;

      const halo=new THREE.Mesh(
        new THREE.TorusGeometry(.16,.018,7,24),
        new THREE.MeshBasicMaterial({
          color:point.color,
          transparent:true,
          opacity:.48,
          depthWrite:false
        })
      );
      halo.rotation.x=Math.PI/2;
      halo.position.y=.43;

      group.add(ring,core,halo);
      group.visible=false;
      this.root.add(group);
      this.markers.set(point.id,{group,ring,core,halo,point});
    }
  }

  mountPrompt(){
    if(!this.container)return;

    const prompt=document.createElement("button");
    prompt.type="button";
    prompt.className="proximity-g11-prompt";
    prompt.hidden=true;
    prompt.innerHTML=`
      <span class="proximity-g11-key">E</span>
      <span class="proximity-g11-prompt-copy">
        <strong>Interagir</strong>
        <small></small>
      </span>
    `;
    prompt.addEventListener("click",()=>{
      if(this.nearest)this.interact(this.nearest);
    });

    this.container.appendChild(prompt);
    this.prompt=prompt;
  }

  update(t=0){
    if(this.disposed)return;

    const walking=Boolean(this.walkExplorer?.isActive?.());
    this.root.visible=walking;

    if(!walking){
      this.nearest=null;
      this.hidePrompt();
      this.markers.forEach(item=>item.group.visible=false);
      return;
    }

    const position=this.camera.position;
    let nearest=null;
    let nearestDistance=Infinity;

    for(const point of this.points){
      const marker=this.markers.get(point.id);
      const dx=position.x-point.position[0];
      const dz=position.z-point.position[2];
      const distance=Math.hypot(dx,dz);

      marker.group.visible=distance<=point.revealDistance;
      if(marker.group.visible){
        const wave=(Math.sin(t*2.3+point.phase)+1)*.5;
        const interacted=this.interacted.has(point.id);
        marker.ring.material.opacity=(interacted?.18:.28)+wave*.12;
        marker.halo.material.opacity=(interacted?.24:.38)+wave*.18;
        marker.halo.position.y=.43+Math.sin(t*1.9+point.phase)*.055;
        marker.halo.rotation.z=t*.32+point.phase;
      }

      if(distance<=point.radius && distance<nearestDistance){
        nearest=point;
        nearestDistance=distance;
      }
    }

    if(this.activePulse && performance.now()<this.pulseUntil){
      const marker=this.markers.get(this.activePulse);
      if(marker){
        const wave=(Math.sin(performance.now()*.018)+1)*.5;
        const s=1.0+wave*.55;
        marker.group.scale.setScalar(s);
        marker.ring.material.opacity=.65;
        marker.halo.material.opacity=.86;
      }
    }else if(this.activePulse){
      const marker=this.markers.get(this.activePulse);
      marker?.group?.scale?.setScalar?.(1);
      this.activePulse=null;
    }

    if(nearest?.id!==this.nearest?.id){
      this.nearest=nearest;
      if(nearest)this.showPrompt(nearest);
      else this.hidePrompt();
    }else if(!nearest){
      this.hidePrompt();
    }
  }

  showPrompt(point){
    if(!this.prompt)return;
    this.prompt.hidden=false;
    const key=this.prompt.querySelector(".proximity-g11-key");
    const strong=this.prompt.querySelector("strong");
    const small=this.prompt.querySelector("small");
    if(key)key.textContent=isTouchDevice()?"TOQUE":"E";
    if(strong)strong.textContent=`${point.icon||"◎"} Interagir`;
    if(small)small.textContent=point.title;
  }

  hidePrompt(){
    if(this.prompt)this.prompt.hidden=true;
  }

  interact(point){
    if(!point||this.disposed)return;

    this.interacted.add(point.id);
    this.storage?.set?.(this.storageKey,[...this.interacted]);

    this.activePulse=point.id;
    this.pulseUntil=performance.now()+1500;

    this.eventBus?.emit?.("immersive:proximity-interaction",{
      moduleId:this.moduleId,
      interactionId:point.id,
      title:point.title,
      at:new Date().toISOString()
    });

    let callbackResult=null;
    try{
      callbackResult=point.onInteract?.(point)||null;
    }catch(error){
      console.warn("Falha na interação G11",error);
    }

    this.openSheet(point,callbackResult);
  }

  openSheet(point,result=null){
    this.closeSheet();

    if(!this.container)return;

    const sheet=document.createElement("aside");
    sheet.className="proximity-g11-sheet";

    const summary=result?.summary||point.summary||"Ponto de interação.";
    const facts=(result?.facts||point.facts||[]).slice(0,3);
    const operational=result?.operational||null;
    const actionLabel=result?.actionLabel||point.actionLabel||null;
    const action=result?.onAction||point.onAction||null;

    sheet.innerHTML=`
      <div class="proximity-g11-sheet-head">
        <div>
          <span class="eyebrow">${escapeHtml(point.category||"Interação no ambiente")}</span>
          <h3>${escapeHtml(point.icon||"◎")} ${escapeHtml(point.title)}</h3>
        </div>
        <button type="button" data-close aria-label="Fechar">×</button>
      </div>
      <p>${escapeHtml(summary)}</p>
      ${operational?`
        <div class="proximity-g13-operational ${operational.active?"active":""}">
          <span>${operational.active?"●":"○"}</span>
          <div>
            <strong>${escapeHtml(operational.label||"Estado operacional")}</strong>
            <small>${escapeHtml(operational.status||"")}</small>
          </div>
        </div>`:""}
      ${facts.length?`
        <div class="proximity-g11-facts">
          ${facts.map(fact=>`<span>${escapeHtml(fact)}</span>`).join("")}
        </div>`:""}
      <div class="proximity-g11-sheet-actions">
        ${actionLabel?`<button class="button primary" type="button" data-action>${escapeHtml(actionLabel)}</button>`:""}
        <button class="button" type="button" data-close>Continuar caminhando</button>
      </div>
    `;

    sheet.querySelectorAll("[data-close]").forEach(button=>{
      button.addEventListener("click",()=>this.closeSheet());
    });

    if(actionLabel && action){
      sheet.querySelector("[data-action]")?.addEventListener("click",()=>{
        action(point);
        this.closeSheet();
      });
    }

    this.container.appendChild(sheet);
    this.sheet=sheet;
  }

  closeSheet(){
    this.sheet?.remove?.();
    this.sheet=null;
  }

  visitedCount(){
    return this.interacted.size;
  }

  dispose(){
    if(this.disposed)return;
    this.disposed=true;
    globalThis.removeEventListener("keydown",this._keyDown);
    this.closeSheet();
    this.prompt?.remove?.();
    this.prompt=null;

    this.root.traverse(object=>{
      object.geometry?.dispose?.();
      if(Array.isArray(object.material))object.material.forEach(m=>m?.dispose?.());
      else object.material?.dispose?.();
    });
    this.root.removeFromParent();
  }
}

function normalizePoints(points){
  return (points||[])
    .filter(point=>point?.id && Array.isArray(point.position))
    .map((point,index)=>({
      radius:1.65,
      revealDistance:5.5,
      color:0x67d4a5,
      phase:index*.63,
      ...point,
      position:[
        Number(point.position[0]||0),
        Number(point.position[1]||0)+.03,
        Number(point.position[2]||0)
      ]
    }));
}

function isTouchDevice(){
  return Boolean(
    globalThis.navigator?.maxTouchPoints>0 ||
    globalThis.matchMedia?.("(pointer: coarse)")?.matches
  );
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
