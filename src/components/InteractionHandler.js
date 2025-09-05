import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { BASE_COLOR, SELECTED_COLOR, PRESSED_Z } from '../utils/constants.js';

export class InteractionHandler {
  constructor(scene, mapRenderer, cityMarkers) {
    this.scene = scene;
    this.mapRenderer = mapRenderer;
    this.cityMarkers = cityMarkers;
    this.selectedState = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.cities = [];
  }

  setCities(cities) {
    this.cities = cities;
  }

  init(renderer) {
    renderer.domElement.addEventListener('mousedown', this.onStateClick.bind(this), false);
  }

  onStateClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.scene.camera);

    // Need to intersect with children since states are now groups
    const intersects = this.raycaster.intersectObjects(this.mapRenderer.getStates(), true);

    if (intersects.length > 0) {
      // Get the parent group (state) from the intersected mesh
      let clickedState = intersects[0].object;
      while (clickedState.parent && !clickedState.name) {
        clickedState = clickedState.parent;
      }
      
      if (this.selectedState !== clickedState) {
        this.selectState(clickedState);
      }
    } else {
      this.deselectAll();
    }
  }

  selectState(state) {
    if (this.selectedState) {
      this.animateState(this.selectedState, 0, BASE_COLOR, 300);
    }
    this.selectedState = state;
    this.animateState(state, PRESSED_Z, SELECTED_COLOR, 300);
    this.cityMarkers.showMarkers(
      this.cities, 
      state.name, 
      this.mapRenderer.getMapCenter(), 
      PRESSED_Z + 1
    );
  }

  deselectAll() {
    if (this.selectedState) {
      this.animateState(this.selectedState, 0, BASE_COLOR, 300);
      this.selectedState = null;
      this.cityMarkers.clear();
    }
  }

  animateState(state, targetZ, targetColor, duration) {
    // Animate the entire state group position
    new TWEEN.Tween(state.position)
      .to({ z: targetZ }, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
    
    // Find and animate the mesh material color (first child is the mesh)
    const mesh = state.children.find(child => child instanceof THREE.Mesh);
    if (mesh && mesh.material) {
      new TWEEN.Tween(mesh.material.color)
        .to(new THREE.Color(targetColor), duration)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
    }
  }
}