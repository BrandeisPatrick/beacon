import { App } from './App.js';

// Initialize the application
const app = new App();
app.init().catch(error => {
  console.error('Failed to start application:', error);
});