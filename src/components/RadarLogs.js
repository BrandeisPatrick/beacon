export class RadarLogs {
  constructor() {
    this.logsElement = null;
    this.refreshInterval = null;
  }

  init(container) {
    this.createLogsStructure();
    container.appendChild(this.logsElement);
    this.loadLogs();

    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => this.loadLogs(), 30000);
  }

  createLogsStructure() {
    this.logsElement = document.createElement('div');
    this.logsElement.className = 'radar-logs-container';

    // Header with title and refresh button
    const header = document.createElement('div');
    header.className = 'radar-header';

    const title = document.createElement('h2');
    title.textContent = 'Radar Monitoring Dashboard';
    title.className = 'radar-title';

    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
      <span>Refresh</span>
    `;
    refreshButton.className = 'radar-refresh-button';
    refreshButton.addEventListener('click', () => this.loadLogs());

    header.appendChild(title);
    header.appendChild(refreshButton);

    // Summary cards
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'radar-summary-container';
    summaryContainer.innerHTML = `
      <div class="radar-card">
        <div class="radar-value" id="total-scans">-</div>
        <div class="radar-label">Total Scans</div>
      </div>
      <div class="radar-card">
        <div class="radar-value" id="active-scans">-</div>
        <div class="radar-label">Active</div>
      </div>
      <div class="radar-card">
        <div class="radar-value" id="completed-scans">-</div>
        <div class="radar-label">Completed</div>
      </div>
      <div class="radar-card">
        <div class="radar-value" id="total-shops">-</div>
        <div class="radar-label">Shops Scanned</div>
      </div>
      <div class="radar-card">
        <div class="radar-value" id="detection-rate">-</div>
        <div class="radar-label">Detection Rate</div>
      </div>
      <div class="radar-card">
        <div class="radar-value" id="scan-cost">-</div>
        <div class="radar-label">Scan Cost</div>
      </div>
    `;

    // Next scan schedule info
    const scheduleInfo = document.createElement('div');
    scheduleInfo.className = 'radar-schedule-info';
    scheduleInfo.innerHTML = `
      <div class="schedule-card">
        <div class="schedule-title">📡 Next Scan Schedule</div>
        <div class="schedule-time" id="next-scan-time">Calculating...</div>
        <div class="schedule-note">Daily automated radar sweeps</div>
      </div>
    `;

    // Loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'radar-loading';
    loadingElement.innerHTML = '<div class="loading-spinner"></div><span>Scanning radar data...</span>';

    // Radar scan history table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'radar-table-container';

    // Detailed schedule table
    const scheduleTable = document.createElement('div');
    scheduleTable.className = 'radar-schedule-table';
    scheduleTable.innerHTML = `
      <div class="schedule-table-header">
        <h3>📅 Scan Schedule & Timeline</h3>
      </div>
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Frequency</th>
            <th>Target Count</th>
            <th>Est. Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="schedule-row">
            <td>Daily 2:00 AM UTC</td>
            <td>24 hours</td>
            <td>50 shops</td>
            <td>10-15 min</td>
            <td><span class="status-badge status-active">🟢 Active</span></td>
          </tr>
          <tr class="schedule-row">
            <td>Weekly Sunday 3:00 AM UTC</td>
            <td>7 days</td>
            <td>200 shops</td>
            <td>30-45 min</td>
            <td><span class="status-badge status-planned">🟡 Planned</span></td>
          </tr>
          <tr class="schedule-row">
            <td>Monthly 1st 4:00 AM UTC</td>
            <td>30 days</td>
            <td>1000 shops</td>
            <td>2-3 hours</td>
            <td><span class="status-badge status-planned">🟡 Planned</span></td>
          </tr>
        </tbody>
      </table>
    `;

    this.logsElement.appendChild(header);
    this.logsElement.appendChild(summaryContainer);
    this.logsElement.appendChild(scheduleInfo);
    this.logsElement.appendChild(scheduleTable);
    this.logsElement.appendChild(loadingElement);
    this.logsElement.appendChild(tableContainer);
  }

  async loadLogs() {
    const loadingElement = this.logsElement.querySelector('.radar-loading');
    const tableContainer = this.logsElement.querySelector('.radar-table-container');

    loadingElement.style.display = 'flex';

    try {
      const response = await fetch('/api/batch-logs');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.updateRadarSummary(result.summary);
        this.updateNextScanTime();
        this.renderRadarTable(result.logs);
        loadingElement.style.display = 'none';
      } else {
        throw new Error(result.error || 'Failed to load logs');
      }

    } catch (error) {
      console.error('Error loading batch logs:', error);
      loadingElement.innerHTML = `<div class="error-message">⚠️ Failed to load radar data: ${error.message}</div>`;
    }
  }

  updateRadarSummary(summary) {
    document.getElementById('total-scans').textContent = summary.totalBatches;
    document.getElementById('active-scans').textContent = summary.pendingBatches;
    document.getElementById('completed-scans').textContent = summary.completedBatches;
    document.getElementById('total-shops').textContent = summary.totalShops;

    const successRate = summary.totalShops > 0
      ? Math.round((summary.totalSuccesses / (summary.totalSuccesses + summary.totalErrors)) * 100)
      : 0;
    document.getElementById('detection-rate').textContent = `${successRate}%`;

    document.getElementById('scan-cost').textContent = `$${summary.totalCost.toFixed(3)}`;
  }

  updateNextScanTime() {
    // Calculate next scan time (daily at 2 AM UTC)
    const now = new Date();
    const nextScan = new Date();
    nextScan.setUTCHours(2, 0, 0, 0);

    // If it's past 2 AM today, set to tomorrow
    if (now > nextScan) {
      nextScan.setUTCDate(nextScan.getUTCDate() + 1);
    }

    const timeUntil = nextScan.getTime() - now.getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    const nextScanElement = document.getElementById('next-scan-time');
    if (nextScanElement) {
      nextScanElement.textContent = `${hoursUntil}h ${minutesUntil}m (${nextScan.toLocaleString()})`;
    }
  }

  renderRadarTable(logs) {
    const tableContainer = this.logsElement.querySelector('.radar-table-container');

    if (logs.length === 0) {
      tableContainer.innerHTML = '<div class="empty-radar">No radar scans found. Scans will appear here once automated sweeps begin.</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'radar-table';

    // Create header
    table.innerHTML = `
      <thead>
        <tr>
          <th>Scan ID</th>
          <th>Status</th>
          <th>Targets</th>
          <th>Detected/Missed</th>
          <th>Duration</th>
          <th>Signals</th>
          <th>Cost</th>
          <th>Initiated</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    logs.forEach(log => {
      const row = document.createElement('tr');
      row.className = `radar-row status-${log.status}`;

      const statusBadge = this.createStatusBadge(log.status);
      const durationText = log.duration_hours ? `${log.duration_hours}h` : '-';
      const successErrorText = log.status === 'completed'
        ? `${log.success_count || 0}/${log.error_count || 0}`
        : '-';

      row.innerHTML = `
        <td class="scan-id">${log.batch_id.substring(0, 8)}...</td>
        <td>${statusBadge}</td>
        <td>${log.shop_count || 0}</td>
        <td>${successErrorText}</td>
        <td>${durationText}</td>
        <td>${log.total_tokens || 0}</td>
        <td>$${(log.cost_estimate || 0).toFixed(3)}</td>
        <td>${this.formatDate(log.created_at)}</td>
        <td>${log.completed_at ? this.formatDate(log.completed_at) : '-'}</td>
      `;

      tbody.appendChild(row);
    });

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
  }

  createStatusBadge(status) {
    const badges = {
      'submitted': '<span class="status-badge status-pending">⏳ Submitted</span>',
      'validating': '<span class="status-badge status-pending">🔍 Validating</span>',
      'in_progress': '<span class="status-badge status-pending">🔄 Processing</span>',
      'finalizing': '<span class="status-badge status-pending">⚙️ Finalizing</span>',
      'completed': '<span class="status-badge status-completed">✅ Completed</span>',
      'failed': '<span class="status-badge status-failed">❌ Failed</span>',
      'expired': '<span class="status-badge status-failed">⏰ Expired</span>',
      'cancelled': '<span class="status-badge status-failed">🚫 Cancelled</span>'
    };

    return badges[status] || `<span class="status-badge">${status}</span>`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  show() {
    if (this.logsElement) {
      this.logsElement.style.display = 'block';
      this.loadLogs(); // Refresh when shown
    }
  }

  hide() {
    if (this.logsElement) {
      this.logsElement.style.display = 'none';
    }
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.logsElement && this.logsElement.parentNode) {
      this.logsElement.parentNode.removeChild(this.logsElement);
    }
  }
}