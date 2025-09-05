import * as THREE from 'three';
import { GREEN_GLOW_COLOR, RED_GLOW_COLOR } from '../utils/constants.js';

export class CityMarkers {
  constructor() {
    this.cityMarkers = new THREE.Group();
    this.greenGlowTexture = this.createGlowTexture(GREEN_GLOW_COLOR);
    this.redGlowTexture = this.createGlowTexture(RED_GLOW_COLOR);
  }

  createGlowTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, color);
    gradient.addColorStop(0.6, color.replace('rgb', 'rgba').replace(')', ',0.2)'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  showMarkers(cities, stateName, mapCenter, zPos) {
    this.cityMarkers.clear();
    const stateCities = cities.filter(c => c.state === stateName);

    stateCities.forEach(city => {
      const material = new THREE.SpriteMaterial({
        map: city.service ? this.greenGlowTexture : this.redGlowTexture,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false,
        transparent: true,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(0.1, 0.1, 1);
      
      // Project city coordinates
      const x = city.lon - mapCenter.x;
      const y = city.lat - mapCenter.y;
      sprite.position.set(x, y, zPos);

      this.cityMarkers.add(sprite);
    });
  }

  clear() {
    this.cityMarkers.clear();
  }

  getGroup() {
    return this.cityMarkers;
  }
}