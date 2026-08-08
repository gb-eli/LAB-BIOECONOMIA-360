export function createWaterSurfaceG5(THREE,{
  width=3,
  height=1,
  colorA=0x2f91a6,
  colorB=0x77ced1,
  opacity=.82,
  qualityRank=1,
  speed=1
}={}){
  const baseA=new THREE.Color(colorA);
  const baseB=new THREE.Color(colorB);
  const stressedA=new THREE.Color(0x697b67);
  const stressedB=new THREE.Color(0x93a276);

  const uniforms={
    uTime:{value:0},
    uColorA:{value:baseA.clone()},
    uColorB:{value:baseB.clone()},
    uOpacity:{value:opacity},
    uSpeed:{value:speed},
    uAmplitude:{value:1},
    uTurbidity:{value:0}
  };

  const seg=qualityRank>=2?48:24;
  const geometry=new THREE.PlaneGeometry(width,height,seg,Math.max(8,Math.floor(seg/3)));

  const material=new THREE.ShaderMaterial({
    uniforms,
    transparent:true,
    depthWrite:true,
    side:THREE.DoubleSide,
    vertexShader:`
      uniform float uTime;
      uniform float uSpeed;
      uniform float uAmplitude;
      varying vec2 vUv;
      varying float vWave;
      void main(){
        vUv=uv;
        vec3 p=position;
        float t=uTime*uSpeed;
        float w1=sin(p.x*3.5+t*1.3)*.018*uAmplitude;
        float w2=cos(p.y*5.2-t*.9)*.012*uAmplitude;
        p.z+=w1+w2;
        vWave=w1+w2;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }
    `,
    fragmentShader:`
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uOpacity;
      uniform float uTurbidity;
      varying vec2 vUv;
      varying float vWave;
      void main(){
        float stripe=.5+.5*sin((vUv.x+vUv.y)*18.0+vWave*85.0);
        vec3 c=mix(uColorA,uColorB,.24+stripe*.32);
        c=mix(c,vec3(.39,.42,.28),uTurbidity*.28);
        float edge=smoothstep(0.0,.12,vUv.y)*smoothstep(0.0,.12,1.0-vUv.y);
        gl_FragColor=vec4(c,uOpacity*(.76+.24*edge));
      }
    `
  });

  const mesh=new THREE.Mesh(geometry,material);

  const setConditions=({
    flow=1,
    clarity=1,
    stress=0,
    opacity:nextOpacity=null
  }={})=>{
    const normalizedStress=clamp(Number(stress||0),0,1);
    const normalizedClarity=clamp(Number(clarity??1),0,1);
    uniforms.uSpeed.value=clamp(Number(flow||1),.22,2.2);
    uniforms.uAmplitude.value=clamp(.62+Number(flow||1)*.38,.35,1.75);
    uniforms.uTurbidity.value=clamp(1-normalizedClarity+normalizedStress*.45,0,1);
    uniforms.uColorA.value.copy(baseA).lerp(stressedA,normalizedStress*.55);
    uniforms.uColorB.value.copy(baseB).lerp(stressedB,normalizedStress*.48);
    if(nextOpacity!=null)uniforms.uOpacity.value=clamp(Number(nextOpacity),.08,.96);
  };

  return{
    mesh,
    update:t=>uniforms.uTime.value=t,
    setOpacity:v=>uniforms.uOpacity.value=clamp(Number(v||.8),.08,.96),
    setConditions,
    dispose:()=>{geometry.dispose();material.dispose();}
  };
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
