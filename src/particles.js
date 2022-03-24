import * as THREE from 'three';
import { Engine, Bodies, Composite } from 'matter-js';
export default class Particles {
  constructor(iCount = 10, iRenderer, rest) {
    Object.assign(this,rest);
    this.engine = Engine.create();
    // create two boxes and a ground
    var boxA = Bodies.rectangle(400, 200, 80, 80);
    var boxB = Bodies.rectangle(450, 50, 80, 80);
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

    // add all of the bodies to the world
    Composite.add(this.engine.world, [boxA, boxB, ground]);

    this.renderer = iRenderer;
    this.count = iCount;
    this.particles = [];
    let bodies = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(new Particle());
    }
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.geometry = new THREE.BufferGeometry();
    this.update();

    var material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPSize: new THREE.Uniform(this.pSize),
      },
    });
    var particleSystem = new THREE.Points(this.geometry, material);
    this.scene.add(particleSystem);

    this.camera.position.z = 2;
    this.renderTarget = new THREE.WebGLRenderTarget(256, 256);
  }

  update(delta) {
    Engine.update(this.engine, delta);
    // this.engine.update(delta)
    this.particles.forEach((particle) => particle.update(delta, this.spread));
    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(this.toArray(), 3)
    );
  }

  render() {
    // draw render target scene to render target
    let currentTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(currentTarget);
  }

  toArray(...args) {
    return this.particles.map((p) => p.position.toArray(...args)).flat();
  }
}

class Particle {
  constructor() {
    this.life = Math.random() * 10 * 1000; // ms
    this.position = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1),
      THREE.MathUtils.randFloatSpread(1),
      0
    );
    this.body = Bodies.circle(this.position.x, this.position.y, 1);
    const velocityMax = 1.3;
    this.velocity = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(velocityMax),
      THREE.MathUtils.randFloatSpread(velocityMax),
      0
    );
  }
  w;

  euclideanModulo(n, m) {
    return ((n % m) + m) % m;
  }
  wrap(val, spread = 1.8) {
    const range = spread * 2;
    const shiftedVal = val + spread;
    return this.euclideanModulo(shiftedVal, range) - spread;
  }

  update(delta = 0, spread = 1.8) {
    this.position.addScaledVector(this.velocity, delta);
    // modulo clamp
    this.position.set(this.wrap(this.position.x,spread), this.wrap(this.position.y,spread));
  }
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uPSize;
void main(){
  vUv = uv;
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position,1.);
  // gl_PointSize = 10. * (1. / -mvPosition.z);
  gl_PointSize = uPSize;
  gl_Position = projectionMatrix * mvPosition;
  gl_Position.x = gl_Position.x * 2.;
}

`;
const fragmentShader = `

uniform float uProgress;
uniform vec2 uMeshScale;
uniform vec2 uMeshPosition;
uniform vec2 uViewSize;
uniform vec2 uResolution;
varying vec2 vUv;
varying vec3 vPosition;
void main(){
  // vec2 uv = gl_FragCoord.xy / uResolution;
  // gl_FragColor = vec4(vec3(0.2),1.);

  float dist = 1. - smoothstep(0.,0.5, distance(gl_PointCoord, vec2(0.5)));
  gl_FragColor = vec4( vec3(0.) ,dist);
  // gl_FragColor = vec4(dist);
  // gl_FragColor = vec4(vec3(0.5), 1.);
}
`;
