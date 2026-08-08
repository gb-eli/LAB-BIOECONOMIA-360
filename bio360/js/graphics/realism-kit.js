export function createRealismKit(THREE){
  const textureFromCanvas=({kind="soil",size=256,seed=11})=>{
    const canvas=document.createElement("canvas");
    canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext("2d");
    const rng=mulberry32(seed);

    const palettes={
      soil:[[65,88,54],[74,104,61],[89,112,66]],
      concrete:[[102,111,107],[120,128,124],[84,94,91]],
      road:[[103,91,73],[122,108,85],[82,78,66]]
    };
    const palette=palettes[kind]||palettes.soil;

    const image=ctx.createImageData(size,size);
    for(let i=0;i<image.data.length;i+=4){
      const c=palette[Math.floor(rng()*palette.length)];
      const jitter=(rng()-.5)*18;
      image.data[i]=clamp(c[0]+jitter);
      image.data[i+1]=clamp(c[1]+jitter);
      image.data[i+2]=clamp(c[2]+jitter);
      image.data[i+3]=255;
    }
    ctx.putImageData(image,0,0);

    for(let i=0;i<70;i++){
      const x=rng()*size,y=rng()*size,r=1+rng()*5;
      ctx.fillStyle=`rgba(255,255,255,${.015+rng()*.035})`;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }

    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(5,5);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=2;
    texture.needsUpdate=true;
    return texture;
  };

  const surfaceMaterial=({kind="soil",color=0xffffff,roughness=.9,metalness=0,repeat=5})=>{
    const map=textureFromCanvas({kind,size:256,seed:kind==="concrete"?31:kind==="road"?43:17});
    map.repeat.set(repeat,repeat);
    return new THREE.MeshStandardMaterial({
      color,
      map,
      roughness,
      metalness
    });
  };

  const addSkyDome=(scene,{top=0x315f73,horizon=0xa7c6b4,bottom=0x2e5138}={})=>{
    const uniforms={
      topColor:{value:new THREE.Color(top)},
      horizonColor:{value:new THREE.Color(horizon)},
      bottomColor:{value:new THREE.Color(bottom)}
    };
    const material=new THREE.ShaderMaterial({
      side:THREE.BackSide,
      depthWrite:false,
      uniforms,
      vertexShader:`varying vec3 vWorldPosition;
        void main(){
          vec4 worldPosition=modelMatrix*vec4(position,1.0);
          vWorldPosition=worldPosition.xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader:`uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main(){
          float h=normalize(vWorldPosition).y;
          vec3 color=h>0.0
            ? mix(horizonColor,topColor,smoothstep(0.0,0.85,h))
            : mix(horizonColor,bottomColor,smoothstep(0.0,0.65,-h));
          gl_FragColor=vec4(color,1.0);
        }`
    });
    const sky=new THREE.Mesh(new THREE.SphereGeometry(75,32,20),material);
    scene.add(sky);
    return sky;
  };

  const applyRenderer=(renderer,quality)=>{
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=quality.rank>=2?1.08:1.0;
    renderer.shadowMap.enabled=Boolean(quality.shadows);
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  };

  const configureSun=(light,quality)=>{
    light.castShadow=Boolean(quality.shadows);
    const size=quality.shadowMap||1024;
    light.shadow.mapSize.set(size,size);
    light.shadow.camera.near=.5;
    light.shadow.camera.far=70;
    light.shadow.bias=-.0004;
  };

  return {textureFromCanvas,surfaceMaterial,addSkyDome,applyRenderer,configureSun};
}

function clamp(v){return Math.max(0,Math.min(255,Math.round(v)));}

function mulberry32(seed){
  return function(){
    let t=seed+=0x6D2B79F5;
    t=Math.imul(t^t>>>15,t|1);
    t^=t+Math.imul(t^t>>>7,t|61);
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
