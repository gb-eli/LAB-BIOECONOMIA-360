export class FirstPersonExplorerG10{
  constructor({
    THREE,
    camera,
    controls,
    canvas,
    container,
    start={position:[0,1.62,6],yaw:0,pitch:0},
    eyeHeight=1.62,
    speed=2.8,
    bounds={minX:-10,maxX:10,minZ:-8,maxZ:8},
    blockers=[],
    onState=()=>{}
  }){
    this.THREE=THREE;
    this.camera=camera;
    this.controls=controls;
    this.canvas=canvas;
    this.container=container;
    this.start=start;
    this.eyeHeight=eyeHeight;
    this.speed=speed;
    this.bounds=bounds;
    this.blockers=blockers;
    this.onState=onState;

    this.active=false;
    this.disposed=false;
    this.yaw=Number(start.yaw||0);
    this.pitch=Number(start.pitch||0);
    this.velocity={x:0,z:0};
    this.keys=new Set();
    this.lookPointer=null;
    this.lookLast={x:0,y:0};
    this.joyPointer=null;
    this.joyOrigin={x:0,y:0};
    this.joy={x:0,y:0};
    this.lastUpdate=performance.now();
    this.saved=null;
    this.ui=null;

    this.forward=new THREE.Vector3();
    this.right=new THREE.Vector3();
    this.next=new THREE.Vector3();

    this._keydown=e=>{
      if(!this.active)return;
      if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){
        e.preventDefault();
        this.keys.add(e.code);
      }
      if(e.code==="Escape"){
        e.preventDefault();
        this.disable("escape");
      }
    };
    this._keyup=e=>this.keys.delete(e.code);

    this._lookDown=e=>{
      if(!this.active || e.pointerType==="touch" && isInsideJoystick(e.target))return;
      if(e.button!=null && e.button!==0)return;
      this.lookPointer=e.pointerId;
      this.lookLast={x:e.clientX,y:e.clientY};
      this.canvas.setPointerCapture?.(e.pointerId);
    };
    this._lookMove=e=>{
      if(!this.active || e.pointerId!==this.lookPointer)return;
      const dx=e.clientX-this.lookLast.x;
      const dy=e.clientY-this.lookLast.y;
      this.lookLast={x:e.clientX,y:e.clientY};
      const sensitivity=e.pointerType==="touch"?.0046:.0032;
      this.yaw-=dx*sensitivity;
      this.pitch=clamp(this.pitch-dy*sensitivity,-1.18,1.18);
    };
    this._lookUp=e=>{
      if(e.pointerId===this.lookPointer){
        this.lookPointer=null;
        this.canvas.releasePointerCapture?.(e.pointerId);
      }
    };
  }

  enable(){
    if(this.disposed||this.active)return false;
    this.active=true;
    this.lastUpdate=performance.now();

    this.saved={
      position:this.camera.position.clone(),
      target:this.controls.target.clone(),
      enabled:this.controls.enabled
    };

    this.controls.enabled=false;
    this.keys.clear();
    this.joy={x:0,y:0};

    const p=this.start.position||[0,this.eyeHeight,6];
    this.camera.position.set(Number(p[0]),this.eyeHeight,Number(p[2]));
    this.yaw=Number(this.start.yaw||0);
    this.pitch=Number(this.start.pitch||0);
    this.applyLook();

    this.mountUI();
    this.bind();
    this.onState({active:true});
    return true;
  }

  disable(reason="user"){
    if(!this.active)return false;
    this.active=false;
    this.unbind();
    this.unmountUI();
    this.keys.clear();
    this.joy={x:0,y:0};

    if(this.saved){
      this.camera.position.copy(this.saved.position);
      this.controls.target.copy(this.saved.target);
      this.controls.enabled=this.saved.enabled;
      this.controls.update?.();
    }else{
      this.controls.enabled=true;
    }

    this.onState({active:false,reason});
    return true;
  }

  toggle(){
    return this.active?this.disable("toggle"):this.enable();
  }

  isActive(){
    return this.active;
  }

  update(now=performance.now()){
    if(!this.active||this.disposed)return;

    const dt=Math.min(.05,Math.max(0,(now-this.lastUpdate)/1000));
    this.lastUpdate=now;

    let strafe=0;
    let forward=0;

    if(this.keys.has("KeyW")||this.keys.has("ArrowUp"))forward+=1;
    if(this.keys.has("KeyS")||this.keys.has("ArrowDown"))forward-=1;
    if(this.keys.has("KeyD")||this.keys.has("ArrowRight"))strafe+=1;
    if(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))strafe-=1;

    strafe+=this.joy.x;
    forward+=-this.joy.y;

    const length=Math.hypot(strafe,forward);
    if(length>.02){
      const norm=Math.max(1,length);
      strafe/=norm;
      forward/=norm;

      this.forward.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
      this.right.set(Math.cos(this.yaw),0,-Math.sin(this.yaw));

      const step=this.speed*dt;
      this.next.copy(this.camera.position)
        .addScaledVector(this.forward,forward*step)
        .addScaledVector(this.right,strafe*step);

      this.next.y=this.eyeHeight;
      this.next.x=clamp(this.next.x,this.bounds.minX,this.bounds.maxX);
      this.next.z=clamp(this.next.z,this.bounds.minZ,this.bounds.maxZ);

      const current=this.camera.position;
      const xCandidate={x:this.next.x,z:current.z};
      const zCandidate={x:current.x,z:this.next.z};

      if(!blocked(xCandidate,this.blockers))current.x=this.next.x;
      if(!blocked(zCandidate,this.blockers))current.z=this.next.z;
      current.y=this.eyeHeight;
    }

    this.applyLook();
  }

  applyLook(){
    const cp=Math.cos(this.pitch);
    const dir=this.forward.set(
      -Math.sin(this.yaw)*cp,
      Math.sin(this.pitch),
      -Math.cos(this.yaw)*cp
    );
    this.controls.target.copy(this.camera.position).add(dir);
    this.camera.lookAt(this.controls.target);
  }

  mountUI(){
    if(this.ui||!this.container)return;

    const root=document.createElement("div");
    root.className="walk-g10-ui";
    root.innerHTML=`
      <div class="walk-g10-reticle" aria-hidden="true"></div>
      <div class="walk-g10-hint">Arraste para olhar • WASD/setas ou joystick</div>
      <div class="walk-g10-joystick" data-walk-joystick aria-label="Controle de movimento">
        <div class="walk-g10-stick"></div>
      </div>
      <button class="walk-g10-exit" type="button">Sair do caminhar</button>
    `;
    this.container.appendChild(root);
    this.ui=root;

    const joy=root.querySelector("[data-walk-joystick]");
    const stick=root.querySelector(".walk-g10-stick");
    const exit=root.querySelector(".walk-g10-exit");

    const joyDown=e=>{
      if(!this.active)return;
      e.preventDefault();
      this.joyPointer=e.pointerId;
      const rect=joy.getBoundingClientRect();
      this.joyOrigin={
        x:rect.left+rect.width/2,
        y:rect.top+rect.height/2
      };
      joy.setPointerCapture?.(e.pointerId);
      this.updateJoy(e,stick);
    };
    const joyMove=e=>{
      if(e.pointerId!==this.joyPointer)return;
      e.preventDefault();
      this.updateJoy(e,stick);
    };
    const joyUp=e=>{
      if(e.pointerId!==this.joyPointer)return;
      this.joyPointer=null;
      this.joy={x:0,y:0};
      stick.style.transform="translate(-50%,-50%)";
      joy.releasePointerCapture?.(e.pointerId);
    };

    joy.addEventListener("pointerdown",joyDown);
    joy.addEventListener("pointermove",joyMove);
    joy.addEventListener("pointerup",joyUp);
    joy.addEventListener("pointercancel",joyUp);
    exit.addEventListener("click",()=>this.disable("button"));

    root._cleanup=()=>{
      joy.removeEventListener("pointerdown",joyDown);
      joy.removeEventListener("pointermove",joyMove);
      joy.removeEventListener("pointerup",joyUp);
      joy.removeEventListener("pointercancel",joyUp);
    };
  }

  updateJoy(e,stick){
    const max=38;
    const dx=e.clientX-this.joyOrigin.x;
    const dy=e.clientY-this.joyOrigin.y;
    const len=Math.hypot(dx,dy);
    const scale=len>max?max/len:1;
    const x=dx*scale;
    const y=dy*scale;
    this.joy={x:x/max,y:y/max};
    stick.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  }

  unmountUI(){
    if(!this.ui)return;
    this.ui._cleanup?.();
    this.ui.remove();
    this.ui=null;
  }

  bind(){
    globalThis.addEventListener("keydown",this._keydown,{passive:false});
    globalThis.addEventListener("keyup",this._keyup);
    this.canvas.addEventListener("pointerdown",this._lookDown);
    this.canvas.addEventListener("pointermove",this._lookMove);
    this.canvas.addEventListener("pointerup",this._lookUp);
    this.canvas.addEventListener("pointercancel",this._lookUp);
  }

  unbind(){
    globalThis.removeEventListener("keydown",this._keydown);
    globalThis.removeEventListener("keyup",this._keyup);
    this.canvas.removeEventListener("pointerdown",this._lookDown);
    this.canvas.removeEventListener("pointermove",this._lookMove);
    this.canvas.removeEventListener("pointerup",this._lookUp);
    this.canvas.removeEventListener("pointercancel",this._lookUp);
  }

  dispose(){
    if(this.disposed)return;
    if(this.active)this.disable("dispose");
    this.disposed=true;
    this.unmountUI();
  }
}

function blocked(point,blockers){
  return (blockers||[]).some(b=>
    point.x>=b.minX&&point.x<=b.maxX&&
    point.z>=b.minZ&&point.z<=b.maxZ
  );
}

function isInsideJoystick(target){
  return Boolean(target?.closest?.("[data-walk-joystick]"));
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
