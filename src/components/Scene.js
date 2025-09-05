import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BACKGROUND_COLOR } from '../utils/constants.js';

export class Scene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
  }

  init(container) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);

    const aspect = window.innerWidth / window.innerHeight;
    const d = 50;
    this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    this.camera.position.set(0, -40, 86.6); // 60-degree viewing angle
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for neuromorphic effect
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;

    this.setupLighting();
  }

  setupLighting() {
    // Dark theme ambient lighting - more subtle
    const ambientLight = new THREE.AmbientLight(0x404047, 0.3);
    this.scene.add(ambientLight);
    
    // Main directional light optimized for dark neuromorphic theme
    const directionalLight1 = new THREE.DirectionalLight(0xf0f0f3, 0.8);
    directionalLight1.position.set(-20, -50, 60);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 500;
    directionalLight1.shadow.camera.left = -100;
    directionalLight1.shadow.camera.right = 100;
    directionalLight1.shadow.camera.top = 100;
    directionalLight1.shadow.camera.bottom = -100;
    directionalLight1.shadow.bias = -0.0001;
    this.scene.add(directionalLight1);
    
    // Fill light for neuromorphic highlights
    const directionalLight2 = new THREE.DirectionalLight(0x6666cc, 0.4);
    directionalLight2.position.set(15, 30, 40);
    this.scene.add(directionalLight2);
    
    // Rim light for definition
    const directionalLight3 = new THREE.DirectionalLight(0x8888ff, 0.3);
    directionalLight3.position.set(0, 0, 50);
    this.scene.add(directionalLight3);
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const d = 50;
    this.camera.left = -d * aspect;
    this.camera.right = d * aspect;
    this.camera.top = d;
    this.camera.bottom = -d;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  add(object) {
    this.scene.add(object);
  }
}