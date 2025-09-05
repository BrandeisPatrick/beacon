import * as THREE from 'three';
import { BASE_COLOR, BORDER_COLOR } from '../utils/constants.js';

export class MapRenderer {
  constructor() {
    this.states = [];
    this.mapCenter = new THREE.Vector3();
  }

  createStateMesh(feature, material, borderMaterial) {
    const shapes = [];
    const coords = feature.geometry.coordinates;

    if (feature.geometry.type === 'Polygon') {
      coords.forEach(poly => {
        const shape = new THREE.Shape();
        poly.forEach((p, i) => i === 0 ? shape.moveTo(p[0], p[1]) : shape.lineTo(p[0], p[1]));
        shapes.push(shape);
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      coords.forEach(multi => multi.forEach(poly => {
        const shape = new THREE.Shape();
        poly.forEach((p, i) => i === 0 ? shape.moveTo(p[0], p[1]) : shape.lineTo(p[0], p[1]));
        shapes.push(shape);
      }));
    }

    if (shapes.length === 0) return null;

    const extrudeSettings = { 
      steps: 2, 
      depth: 3, 
      bevelEnabled: true, 
      bevelThickness: 0.4, // Increased for more rounding
      bevelSize: 0.4, // Increased for more rounding  
      bevelSegments: 8 // More segments for smoother curves
    };
    
    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
    const group = new THREE.Group();
    
    // Create main state mesh
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.name = feature.properties.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Create border wireframe for clear boundaries
    const edges = new THREE.EdgesGeometry(geometry);
    const border = new THREE.LineSegments(edges, borderMaterial.clone());
    border.position.z = 0.01; // Slightly above the surface
    
    group.add(mesh);
    group.add(border);
    group.name = feature.properties.name;
    
    return group;
  }

  renderStates(statesData) {
    // Dark neuromorphic material
    const stateMaterial = new THREE.MeshStandardMaterial({ 
      color: BASE_COLOR, 
      metalness: 0.1, 
      roughness: 0.7,
      transparent: false
    });
    
    // Border material for clear state boundaries
    const borderMaterial = new THREE.LineBasicMaterial({
      color: BORDER_COLOR,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    
    const group = new THREE.Group();

    // Filter out Alaska and Hawaii to focus on contiguous US
    const excludedStates = ['Alaska', 'Hawaii'];
    
    statesData.features.forEach(feature => {
      if (excludedStates.includes(feature.properties.name)) {
        return; // Skip Alaska and Hawaii
      }
      
      const stateMesh = this.createStateMesh(feature, stateMaterial, borderMaterial);
      if (stateMesh) {
        group.add(stateMesh);
        this.states.push(stateMesh);
      }
    });

    const box = new THREE.Box3().setFromObject(group);
    this.mapCenter = box.getCenter(new THREE.Vector3());
    group.position.sub(this.mapCenter);

    return group;
  }

  getStates() {
    return this.states;
  }

  getMapCenter() {
    return this.mapCenter;
  }
}