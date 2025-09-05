export class LoadingIndicator {
  constructor() {
    this.element = null;
  }

  show(container) {
    this.element = document.createElement('div');
    this.element.id = 'loading';
    this.element.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 20px 40px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 16px;
      color: #333;
      z-index: 1000;
    `;
    this.element.textContent = 'Loading 3D Map...';
    container.appendChild(this.element);
  }

  hide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  showError(message) {
    if (this.element) {
      this.element.textContent = `Error: ${message}`;
      this.element.style.background = 'rgba(255, 0, 0, 0.1)';
      this.element.style.color = '#d32f2f';
      this.element.style.border = '1px solid #d32f2f';
    }
  }
}