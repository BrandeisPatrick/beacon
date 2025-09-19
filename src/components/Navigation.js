export class Navigation {
  constructor() {
    this.currentTab = 'map';
    this.navigationElement = null;
  }

  init(container) {
    this.navigationElement = document.createElement('nav');
    this.navigationElement.id = 'navigation';
    this.navigationElement.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand"><span class="nav-brackets">&lt;</span> beacon <span class="nav-brackets">&gt;</span></div>
        <div class="nav-tabs">
          <button class="nav-tab active" data-tab="map">map</button>
          <button class="nav-tab" data-tab="database">database</button>
          <button class="nav-tab" data-tab="contact">contact</button>
        </div>
      </div>
    `;

    // Insert navigation at the beginning of the container
    container.insertBefore(this.navigationElement, container.firstChild);
    
    // Add event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    const tabs = this.navigationElement.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
  }

  switchTab(tabName) {
    if (tabName === this.currentTab) return;

    // Update active state
    const tabs = this.navigationElement.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.currentTab = tabName;

    // For now, just console log - later we can add actual tab functionality
    console.log(`Switched to tab: ${tabName}`);
  }

  getCurrentTab() {
    return this.currentTab;
  }
}