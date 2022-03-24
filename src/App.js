import React, { useRef, useState, useEffect, forwardRef } from 'react';
import './style.css';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWindowResize } from 'beautiful-react-hooks';
import Particles from './particles';
import useMouse from '@react-hook/mouse-position';

export default function App() {
  const zFactor = -0.1;
  const sizeFactor = 0.7;
  const scaleFactor = 1.7;
  return (
    <>
      {/* <Mouse /> */}
      <Canvas
        gl={
          {
            // premultipliedAlpha: false,
          }
        }
      >
        <perspectiveCamera
          args={[45, window.innerWidth / window.innerHeight, 0.1, 10000]}
        />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        {/* <Box position={[-1.2, 0, -2]} rotate={-1} /> */}
        {/* <Box position={[1.2, 0, -2]} /> */}
        <Blobie
          position={[0, 0, zFactor * 4]}
          color={[109, 104, 117]}
          count={17}
          pSize={325 * sizeFactor}
          speedFactor={0.1}
          rotation={[0, 0, 0]}
          spread={0.5}
          scale={scaleFactor * 1.6}
        />
        <Blobie
          position={[0, 0, zFactor * 3]}
          color={[255, 180, 162]}
          count={36}
          speedFactor={1}
          pSize={275 * sizeFactor}
          spread={0.6}
          scale={scaleFactor}
        />
        <Blobie
          position={[0, 0, zFactor * 2]}
          color={[229, 152, 155]}
          count={70}
          pSize={175 * sizeFactor}
          speedFactor={0.4}
          spread={0.45}
          scale={scaleFactor}
        />
        <Blobie
          position={[0, 0, zFactor * 1]}
          color={[181, 131, 141]}
          count={140}
          pSize={75 * sizeFactor}
          speedFactor={0.1}
          spread={0.3}
          scale={scaleFactor}
        />
      </Canvas>
    </>
  );
}

function Mouse() {
  const ref = React.useRef(null);
  const mouse = useMouse(ref, {
    enterDelay: 100,
    leaveDelay: 100,
  });

  useEffect(() => {
    console.log(mouse);
  }, [mouse]);
  return (
    <div className="overlay">
      <div className="inner" ref={ref}></div>
    </div>
  );
}

function Blobie({
  color,
  count = 40,
  pSize,
  spread = 1.8,
  speedFactor = 1,
  ...props
}) {
  const segments = 1;
  // 128;
  // This reference will give us direct access to the mesh
  const mesh = useRef();
  const { gl } = useThree();
  const particles = useRef(
    new Particles(count, gl, { pSize, spread, speedFactor })
  );
  const uniforms = useRef({
    uResolution: new THREE.Uniform([window.innerWidth, window.innerHeight]),
    uProgress: new THREE.Uniform(0),
    uMeshScale: new THREE.Uniform(new THREE.Vector2(1, 1)),
    uMeshPosition: new THREE.Uniform(new THREE.Vector2(0, 0)),
    uViewSize: new THREE.Uniform(new THREE.Vector2(1, 1)),
    uColor: new THREE.Uniform(new THREE.Vector3(...color)),

    uParticleTexture: {
      type: 't',
      value: null,
    },
  });
  // watch window resize
  useEffect(() => {
    //https://picsum.photos/id/237/200/300
    const context = gl.getContext();
    // context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_DST_COLOR);
    context.enable(context.BLEND);
    // context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_COLOR);
    // context.blendFunc(context.SRC_ALPHA, context.DST_COLOR);
    // context.blendFunc(context.SRC_COLOR, context.DST_COLOR);
    context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);

    // context.colorMask(false, false, false, true);
    // context.clearColor(0, 0, 0, 1);
    // context.clear(context.COLOR_BUFFER_BIT);

    console.log(context, gl);
    function update() {
      uniforms.current.uResolution.value = [
        window.innerWidth,
        window.innerHeight,
      ];
    }
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener(update);
    };
  }, []);

  useFrame((root, delta) => {
    particles.current.update(delta);
    particles.current.render();
    uniforms.current.uParticleTexture.value =
      particles.current.renderTarget.texture;
  });

  return (
    <mesh ref={mesh} scale={1} {...props}>
      <planeBufferGeometry args={[4, 4, segments, segments]} />
      <shaderMaterial
        args={[
          {
            uniforms: uniforms.current,
            vertexShader: BannerVert,
            fragmentShader: BannerFrag,
            // side: THREE.DoubleSide,
          },
        ]}
      />
    </mesh>
  );
}

const BannerVert = `
uniform float uProgress;
uniform vec2 uMeshScale;
uniform vec2 uMeshPosition;
uniform vec2 uViewSize;
varying vec2 vUv;
varying vec3 vPosition;

void main(){
  vUv = uv;
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position,1.);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const BannerFrag = `

uniform float uProgress;
uniform vec2 uMeshScale;
uniform vec2 uMeshPosition;
uniform vec2 uViewSize;
uniform vec2 uResolution;
uniform sampler2D uParticleTexture;
uniform vec3 uColor;
varying vec2 vUv;

void main(){
  // vec2 uv = gl_FragCoord.xy / uResolution;
  // gl_FragColor = vec4(vec3(0.2),1.);

  // gl_FragColor = vec4(vUv.yyx ,1.);
  gl_FragColor = vec4(vec3(1.), 1.);
  vec4 pTexture = texture2D(uParticleTexture,vUv);
  if(pTexture.a < 0.5){
    pTexture.a =  0.;
  }else{
    pTexture.a =  1.;
    // pTexture.xyz = vec3(255., 180., 162.) / 255.;
    pTexture.xyz = uColor / 255.;
  }
  
  // pTexture.a = smoothstep(0.1, 1., pTexture.a);
  // pTexture.xyz = 0.1;
  gl_FragColor = pTexture;
  
}
`;

function getViewSize(camera) {
  const fovInRadians = (camera.fov * Math.PI) / 180;
  const height = Math.abs(camera.position.z * Math.tan(fovInRadians / 2) * 2);

  return { width: height * camera.aspect, height };
}

function Box({ rotate = 1, ...props }) {
  // This reference will give us direct access to the mesh
  const mesh = useRef();
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (mesh.current.rotation.x += 0.01 * rotate));
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}
