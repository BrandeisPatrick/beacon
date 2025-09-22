export class DatabaseTable {
  constructor() {
    this.data = [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.tableElement = null;
    this.searchTerm = '';
  }

  init(container) {
    this.createTableStructure();
    container.appendChild(this.tableElement);
    this.setupEventListeners();
  }

  createTableStructure() {
    // Create main table container
    this.tableElement = document.createElement('div');
    this.tableElement.className = 'database-container';

    // Create search bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search businesses...';
    searchInput.className = 'search-input';
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.filterAndRender();
    });

    searchContainer.appendChild(searchInput);

    // Create table wrapper for scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';

    // Create table element
    const table = document.createElement('table');
    table.className = 'data-table';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const columns = [
      { key: 'type', label: 'Business Type' },
      { key: 'name', label: 'Business Name' },
      { key: 'location', label: 'Location' },
      { key: 'zipCode', label: 'Zip Code' },
      { key: 'decoration', label: 'Decoration' },
      { key: 'coffee', label: 'Coffee' },
      { key: 'studySuitable', label: 'Study Suitable' },
      { key: 'parking', label: 'Parking' },
      { key: 'sources', label: 'Sources' }
    ];

    columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column.label;
      th.className = 'table-header';
      th.dataset.column = column.key;

      // Add sort indicator
      const sortIndicator = document.createElement('span');
      sortIndicator.className = 'sort-indicator';
      sortIndicator.innerHTML = '↕';
      th.appendChild(sortIndicator);

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    tbody.className = 'table-body';
    table.appendChild(tbody);

    tableWrapper.appendChild(table);

    // Assemble the complete structure
    this.tableElement.appendChild(searchContainer);
    this.tableElement.appendChild(tableWrapper);
  }

  setupEventListeners() {
    // Add click listeners for sortable headers
    const headers = this.tableElement.querySelectorAll('.table-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.column;
        this.sortBy(column);
      });
    });
  }

  setData(data) {
    this.data = data;
    this.filterAndRender();
  }

  filterAndRender() {
    let filteredData = this.data;

    // Apply search filter
    if (this.searchTerm) {
      filteredData = this.data.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(subValue =>
              subValue.toString().toLowerCase().includes(this.searchTerm)
            );
          }
          return value.toString().toLowerCase().includes(this.searchTerm);
        });
      });
    }

    this.renderTableRows(filteredData);
  }

  sortBy(column) {
    // Update sort direction
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Update sort indicators
    this.updateSortIndicators();

    // Sort the data
    const sortedData = [...this.data].sort((a, b) => {
      let aValue, bValue;

      if (column === 'decoration' || column === 'coffee' || column === 'studySuitable') {
        aValue = a.ratings[column];
        bValue = b.ratings[column];
      } else {
        aValue = a[column];
        bValue = b[column];
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.renderTableRows(sortedData);
  }

  updateSortIndicators() {
    const headers = this.tableElement.querySelectorAll('.table-header');
    headers.forEach(header => {
      const indicator = header.querySelector('.sort-indicator');
      if (header.dataset.column === this.sortColumn) {
        indicator.innerHTML = this.sortDirection === 'asc' ? '↑' : '↓';
        header.classList.add('sorted');
      } else {
        indicator.innerHTML = '↕';
        header.classList.remove('sorted');
      }
    });
  }

  renderTableRows(data) {
    const tbody = this.tableElement.querySelector('.table-body');
    tbody.innerHTML = '';

    data.forEach((item, index) => {
      const row = document.createElement('tr');
      row.className = 'table-row';

      // Business Type
      const typeCell = document.createElement('td');
      typeCell.textContent = item.type;
      typeCell.className = 'table-cell';
      row.appendChild(typeCell);

      // Business Name
      const nameCell = document.createElement('td');
      nameCell.textContent = item.name;
      nameCell.className = 'table-cell business-name';
      row.appendChild(nameCell);

      // Location
      const locationCell = document.createElement('td');
      locationCell.textContent = item.location;
      locationCell.className = 'table-cell';
      row.appendChild(locationCell);

      // Zip Code
      const zipCell = document.createElement('td');
      zipCell.textContent = item.zipCode;
      zipCell.className = 'table-cell';
      row.appendChild(zipCell);

      // Decoration Rating
      const decorationCell = document.createElement('td');
      decorationCell.className = 'table-cell rating-cell';
      decorationCell.appendChild(this.createRatingDisplay(item.ratings.decoration));
      row.appendChild(decorationCell);

      // Coffee Rating
      const coffeeCell = document.createElement('td');
      coffeeCell.className = 'table-cell rating-cell';
      coffeeCell.appendChild(this.createRatingDisplay(item.ratings.coffee));
      row.appendChild(coffeeCell);

      // Study Suitable Rating
      const studyCell = document.createElement('td');
      studyCell.className = 'table-cell rating-cell';
      studyCell.appendChild(this.createRatingDisplay(item.ratings.studySuitable));
      row.appendChild(studyCell);

      // Parking
      const parkingCell = document.createElement('td');
      parkingCell.className = 'table-cell';
      parkingCell.appendChild(this.createParkingBadge(item.parking));
      row.appendChild(parkingCell);

      // Sources
      const sourcesCell = document.createElement('td');
      sourcesCell.className = 'table-cell';
      sourcesCell.appendChild(this.createSourcesDisplay(item.sources, item.evidence));
      row.appendChild(sourcesCell);

      tbody.appendChild(row);
    });
  }

  createRatingDisplay(rating) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-display';

    for (let i = 1; i <= 3; i++) {
      const circle = document.createElement('span');
      circle.className = `rating-circle ${i <= rating ? 'filled' : 'empty'}`;
      circle.textContent = '●';
      ratingContainer.appendChild(circle);
    }

    return ratingContainer;
  }

  createParkingBadge(parkingType) {
    const badge = document.createElement('span');
    badge.className = `parking-badge parking-${parkingType}`;
    badge.textContent = parkingType.charAt(0).toUpperCase() + parkingType.slice(1);
    return badge;
  }

  createSourcesDisplay(sources = [], evidence = []) {
    const container = document.createElement('div');
    container.className = 'sources-container';

    if (!sources || sources.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.textContent = 'Static data';
      placeholder.className = 'sources-placeholder';
      container.appendChild(placeholder);
      return container;
    }

    // Show first few sources as links
    sources.slice(0, 3).forEach((source, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.textContent = ' • ';
        separator.className = 'source-separator';
        container.appendChild(separator);
      }

      const link = document.createElement('a');
      link.href = source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `Source ${index + 1}`;
      link.className = 'source-link';
      container.appendChild(link);
    });

    // Show evidence as tooltip or expandable section
    if (evidence && evidence.length > 0) {
      const evidenceButton = document.createElement('button');
      evidenceButton.textContent = '💬';
      evidenceButton.className = 'evidence-button';
      evidenceButton.title = evidence.join('\n\n');
      evidenceButton.addEventListener('click', (e) => {
        e.preventDefault();
        alert(evidence.join('\n\n'));
      });
      container.appendChild(evidenceButton);
    }

    return container;
  }

  show() {
    if (this.tableElement) {
      this.tableElement.style.display = 'block';
    }
  }

  hide() {
    if (this.tableElement) {
      this.tableElement.style.display = 'none';
    }
  }

  destroy() {
    if (this.tableElement && this.tableElement.parentNode) {
      this.tableElement.parentNode.removeChild(this.tableElement);
    }
  }
}