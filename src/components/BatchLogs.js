export class BatchLogs {
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
    this.logsElement.className = 'batch-logs-container';

    // Header with title and refresh button
    const header = document.createElement('div');
    header.className = 'logs-header';

    const title = document.createElement('h2');
    title.textContent = 'OpenAI Batch Processing Logs';
    title.className = 'logs-title';

    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄 Refresh';
    refreshButton.className = 'refresh-button';
    refreshButton.addEventListener('click', () => this.loadLogs());

    header.appendChild(title);
    header.appendChild(refreshButton);

    // Summary cards
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'summary-container';
    summaryContainer.innerHTML = `
      <div class="summary-card">
        <div class="summary-value" id="total-batches">-</div>
        <div class="summary-label">Total Batches</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" id="pending-batches">-</div>
        <div class="summary-label">Pending</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" id="completed-batches">-</div>
        <div class="summary-label">Completed</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" id="total-shops">-</div>
        <div class="summary-label">Shops Processed</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" id="success-rate">-</div>
        <div class="summary-label">Success Rate</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" id="total-cost">-</div>
        <div class="summary-label">Est. Cost</div>
      </div>
    `;

    // Loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'logs-loading';
    loadingElement.innerHTML = '<div class="loading-spinner"></div><span>Loading batch logs...</span>';

    // Logs table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'logs-table-container';

    this.logsElement.appendChild(header);
    this.logsElement.appendChild(summaryContainer);
    this.logsElement.appendChild(loadingElement);
    this.logsElement.appendChild(tableContainer);
  }

  async loadLogs() {
    const loadingElement = this.logsElement.querySelector('.logs-loading');
    const tableContainer = this.logsElement.querySelector('.logs-table-container');

    loadingElement.style.display = 'flex';

    try {
      const response = await fetch('/api/batch-logs');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.updateSummary(result.summary);
        this.renderLogsTable(result.logs);
        loadingElement.style.display = 'none';
      } else {
        throw new Error(result.error || 'Failed to load logs');
      }

    } catch (error) {
      console.error('Error loading batch logs:', error);
      loadingElement.innerHTML = `<div class="error-message">⚠️ Failed to load logs: ${error.message}</div>`;
    }
  }

  updateSummary(summary) {
    document.getElementById('total-batches').textContent = summary.totalBatches;
    document.getElementById('pending-batches').textContent = summary.pendingBatches;
    document.getElementById('completed-batches').textContent = summary.completedBatches;
    document.getElementById('total-shops').textContent = summary.totalShops;

    const successRate = summary.totalShops > 0
      ? Math.round((summary.totalSuccesses / (summary.totalSuccesses + summary.totalErrors)) * 100)
      : 0;
    document.getElementById('success-rate').textContent = `${successRate}%`;

    document.getElementById('total-cost').textContent = `$${summary.totalCost.toFixed(3)}`;
  }

  renderLogsTable(logs) {
    const tableContainer = this.logsElement.querySelector('.logs-table-container');

    if (logs.length === 0) {
      tableContainer.innerHTML = '<div class="empty-logs">No batch logs found. Batches will appear here once cron jobs start running.</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'logs-table';

    // Create header
    table.innerHTML = `
      <thead>
        <tr>
          <th>Batch ID</th>
          <th>Status</th>
          <th>Shops</th>
          <th>Success/Error</th>
          <th>Duration</th>
          <th>Tokens</th>
          <th>Cost</th>
          <th>Created</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    logs.forEach(log => {
      const row = document.createElement('tr');
      row.className = `log-row status-${log.status}`;

      const statusBadge = this.createStatusBadge(log.status);
      const durationText = log.duration_hours ? `${log.duration_hours}h` : '-';
      const successErrorText = log.status === 'completed'
        ? `${log.success_count || 0}/${log.error_count || 0}`
        : '-';

      row.innerHTML = `
        <td class="batch-id">${log.batch_id.substring(0, 8)}...</td>
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