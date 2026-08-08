import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";

let s=null;

export default{
  id:"lab-biodigestor-3d",

  async mount(context,manifest){
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Laboratório de sustentabilidade</span>
            <span class="lab-badge">3D real • G1</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>
            Ajuste o cenário e observe visualmente o fluxo: resíduo orgânico → biodigestão →
            biogás → uso energético + biofertilizante.
          </p>
        </header>

        <div id="bio-context-slot"></div>

        <div class="lab-workspace">
          <section class="lab-canvas-wrap three-stage" id="bio-stage">
            <canvas id="bio-canvas" aria-label="Biodigestor Virtual em 3D"></canvas>
            <div id="bio-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel bio-form">
              <span class="eyebrow">Entradas</span>
              <div class="range-field">
                <label>Resíduo orgânico <strong><span id="mass-v">500</span> kg/dia</strong></label>
                <input id="mass" type="range" min="100" max="1000" value="500" step="50">
              </div>
              <div class="range-field">
                <label>Umidade <strong><span id="moist-v">75</span>%</strong></label>
                <input id="moist" type="range" min="60" max="90" value="75">
              </div>
              <div class="range-field">
                <label>Eficiência didática <strong><span id="eff-v">70</span>%</strong></label>
                <input id="eff" type="range" min="50" max="90" value="70">
              </div>
            </section>

            <section class="lab-panel">
              <h2>Saídas didáticas</h2>
              <div class="sim-output">
                <div class="metric"><strong id="bio-gas">--</strong><span>Biogás</span></div>
                <div class="metric"><strong id="bio-energy">--</strong><span>Energia</span></div>
                <div class="metric"><strong id="bio-fertilizer">--</strong><span>Biofertilizante</span></div>
              </div>
              <div class="didactic-note">
                São <strong>índices comparativos educacionais</strong>. Ainda não representam m³ de biogás,
                kWh ou massa técnica de digestato. Uma fase posterior poderá usar coeficientes validados.
              </div>
            </section>

            <section class="lab-panel">
              <h3>Fluxo</h3>
              <ul class="list">
                <li>1. Entrada de matéria orgânica</li>
                <li>2. Processo no biodigestor</li>
                <li>3. Formação de biogás</li>
                <li>4. Saída de biofertilizante</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#bio-canvas");
    const stage=document.querySelector("#bio-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[10,7,12],target:[0,1,0],background:0x07130f
    });
    const {THREE,scene,camera,renderer,controls}=viewport;
    const perf=context.performance.createSession(manifest.id);

    scene.add(new THREE.HemisphereLight(0xeafff5,0x1e2d26,2.2));
    const light=new THREE.DirectionalLight(0xffefd8,3);
    light.position.set(7,11,6);light.castShadow=true;scene.add(light);

    const ground=new THREE.Mesh(
      new THREE.PlaneGeometry(18,14),
      new THREE.MeshStandardMaterial({color:0x2d4134,roughness:1})
    );
    ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

    // Main digester
    const tankMat=new THREE.MeshStandardMaterial({color:0x5c756d,roughness:.55,metalness:.2});
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.35,3.8,40),tankMat);
    tank.position.y=1.9;tank.castShadow=true;scene.add(tank);

    const dome=new THREE.Mesh(
      new THREE.SphereGeometry(2.18,36,18,0,Math.PI*2,0,Math.PI/2),
      new THREE.MeshStandardMaterial({color:0x667f76,roughness:.5,metalness:.18})
    );
    dome.position.y=3.8;scene.add(dome);

    // Organic fill indicator
    const fill=new THREE.Mesh(
      new THREE.CylinderGeometry(1.95,1.95,2,36),
      new THREE.MeshStandardMaterial({color:0x627235,roughness:.95})
    );
    fill.position.y=1;scene.add(fill);

    // Feed hopper
    const hopper=new THREE.Mesh(
      new THREE.ConeGeometry(1.05,1.5,22),
      new THREE.MeshStandardMaterial({color:0x76916b,roughness:.8})
    );
    hopper.rotation.z=Math.PI;
    hopper.position.set(-4.3,1.5,0);scene.add(hopper);

    const feedPipe=new THREE.Mesh(
      new THREE.CylinderGeometry(.22,.22,3.1,16),
      new THREE.MeshStandardMaterial({color:0x70827b,metalness:.25,roughness:.5})
    );
    feedPipe.rotation.z=Math.PI/2;
    feedPipe.position.set(-2.7,.75,0);scene.add(feedPipe);

    // Gas holder
    const gasHolder=new THREE.Mesh(
      new THREE.SphereGeometry(1.15,28,18),
      new THREE.MeshPhysicalMaterial({color:0x59c6af,transparent:true,opacity:.72,roughness:.25})
    );
    gasHolder.position.set(4.2,3.1,-.2);scene.add(gasHolder);

    // Outlet
    const outlet=new THREE.Mesh(
      new THREE.CylinderGeometry(.28,.28,3.1,16),
      new THREE.MeshStandardMaterial({color:0x65766f,metalness:.2})
    );
    outlet.rotation.z=Math.PI/2;outlet.position.set(2.7,.8,2);scene.add(outlet);

    const fertilizer=new THREE.Mesh(
      new THREE.BoxGeometry(2.2,.8,1.7),
      new THREE.MeshStandardMaterial({color:0x6e7b3c,roughness:.9})
    );
    fertilizer.position.set(4.7,.4,2);scene.add(fertilizer);

    // Gas pipe visual
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,4.1,0),
      new THREE.Vector3(1.5,5,0),
      new THREE.Vector3(3,4.6,-.1),
      new THREE.Vector3(4.1,4,-.2)
    ]);
    const pipe=new THREE.Mesh(
      new THREE.TubeGeometry(curve,32,.12,10,false),
      new THREE.MeshStandardMaterial({color:0x7a8b85,metalness:.3,roughness:.45})
    );
    scene.add(pipe);

    // Bubble particles
    const bubbles=[];
    const bubbleGeo=new THREE.SphereGeometry(.07,8,6);
    const bubbleMat=new THREE.MeshBasicMaterial({color:0x9beed4,transparent:true,opacity:.7});
    for(let i=0;i<56;i++){
      const b=new THREE.Mesh(bubbleGeo,bubbleMat);
      b.position.set(
        Math.sin(i*12.41)*1.55,
        .3+(i%13)*.22,
        Math.cos(i*7.73)*1.55
      );
      b.userData.baseY=b.position.y;
      b.userData.phase=i*.61;
      scene.add(b);bubbles.push(b);
    }

    const inputs={
      mass:document.querySelector("#mass"),
      moist:document.querySelector("#moist"),
      eff:document.querySelector("#eff")
    };

    const incoming=context.labContext.latestFor(manifest.id,{type:"organic-residue"});
    const contextSlot=document.querySelector("#bio-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Resíduos recebidos da Produção Animal"
      });
    }

    let current={mass:500,moist:75,eff:70};

    const update=()=>{
      current={
        mass:Number(inputs.mass.value),
        moist:Number(inputs.moist.value),
        eff:Number(inputs.eff.value)
      };
      document.querySelector("#mass-v").textContent=current.mass;
      document.querySelector("#moist-v").textContent=current.moist;
      document.querySelector("#eff-v").textContent=current.eff;

      const result=calc(current.mass,current.moist,current.eff);
      document.querySelector("#bio-gas").textContent=result.gas;
      document.querySelector("#bio-energy").textContent=result.energy;
      document.querySelector("#bio-fertilizer").textContent=result.fertilizer;

      const normalized=(current.mass-100)/900;
      const height=.7+normalized*2.4;
      fill.scale.y=height/2;
      fill.position.y=height/2;

      gasHolder.scale.setScalar(.75+Math.min(1,result.gas/150)*.45);
      fertilizer.scale.y=.55+Math.min(1,result.fertilizer/600)*.65;

      context.events.emit("simulation:updated",{moduleId:manifest.id,indicators:result});
    };

    const cleanup=[];

    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,
        transfer:incoming,
        root:contextSlot,
        onApply:transfer=>{
          inputs.mass.value=Math.max(100,Math.min(1000,Math.round(transfer.payload.massKgDay||500)));
          inputs.moist.value=Math.max(60,Math.min(90,Math.round(transfer.payload.moisturePercent||75)));
          inputs.eff.value=Math.max(50,Math.min(90,Math.round(55+(transfer.payload.managementPercent||60)*.35)));
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    Object.values(inputs).forEach(el=>{
      el.addEventListener("input",update);
      cleanup.push(()=>el.removeEventListener("input",update));
    });
    update();

    s={
      context,manifest,viewport,perf,scene,camera,renderer,controls,fill,gasHolder,fertilizer,
      bubbles,currentRef:()=>current,running:false,raf:0,start:performance.now(),cleanup
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},

  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.perf.dispose();
    s.viewport.dispose();
    s=null;
  }
};

function loop(now){
  if(!s?.running)return;
  s.raf=requestAnimationFrame(loop);
  const metrics=s.perf.sample(now);
  const t=(now-s.start)*.001;
  const q=s.context.quality.current;
  const visible=Math.min(s.bubbles.length,q.particles);

  s.bubbles.forEach((bubble,i)=>{
    bubble.visible=i<visible;
    if(!bubble.visible)return;
    bubble.position.y=.35+((bubble.userData.baseY+t*(.45+s.currentRef().eff/240)+bubble.userData.phase)%3.2);
  });

  s.controls.update();
  s.renderer.render(s.scene,s.camera);
  document.querySelector("#bio-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}<br>`+
    `Partículas: ${visible}`;
}

function calc(mass,moist,eff){
  const dry=mass*(1-moist/100);
  const process=eff/100;
  return{
    gas:Math.round(dry*process*.8),
    energy:Math.round(dry*process*.55),
    fertilizer:Math.round(mass*(.45+.25*process))
  };
}
