document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.querySelector('.close');
    const settingsGrid = document.getElementById('settings-grid');
    const saveSettingsButton = document.getElementById('save-settings');

    const GRID_SIZE = 20;
    let cellStates = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    let apartmentLayout = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(true));

    // Initialize grid cells
    function initializeGrid() {
        gridContainer.innerHTML = '';
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                const key = `${row}-${col}`;
                const state = localStorage.getItem(key);
                if (state === 'clean') {
                    cell.classList.add('clean');
                    cellStates[row][col] = true;
                } else {
                    cellStates[row][col] = false;
                }

                // Click to toggle cell state
                cell.addEventListener('click', () => {
                    cell.classList.toggle('clean');
                    cellStates[row][col] = !cellStates[row][col];
                    localStorage.setItem(key, cellStates[row][col] ? 'clean' : 'dirty');
                });

                // Set visibility based on apartment layout
                if (apartmentLayout[row][col]) {
                    cell.style.display = 'block';
                } else {
                    cell.style.display = 'none';
                }

                gridContainer.appendChild(cell);
            }
        }
    }

    // Load settings from localStorage
    function loadSettings() {
        const savedLayout = localStorage.getItem('apartmentLayout');
        if (savedLayout) {
            apartmentLayout = JSON.parse(savedLayout);
        }
    }

    // Initialize settings modal
    function initializeSettingsModal() {
        settingsGrid.innerHTML = '';
        for (let row = 0; row < 10; row++) { // Example: 10x10 settings
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.classList.add('settings-cell');
                if (apartmentLayout[row][col]) {
                    cell.classList.add('active');
                }

                cell.addEventListener('click', () => {
                    cell.classList.toggle('active');
                    apartmentLayout[row][col] = !apartmentLayout[row][col];
                });

                settingsGrid.appendChild(cell);
            }
        }
    }

    // Save settings to localStorage
    function saveSettings() {
        localStorage.setItem('apartmentLayout', JSON.stringify(apartmentLayout));
        initializeGrid();
        closeSettingsModal();
    }

    // Open settings modal
    settingsButton.addEventListener('click', () => {
        initializeSettingsModal();
        settingsModal.style.display = 'block';
    });

    // Close settings modal
    closeModal.addEventListener('click', closeSettingsModal);

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    saveSettingsButton.addEventListener('click', saveSettings);

    // Schedule daily reset at 2 AM
    function scheduleDailyReset() {
        const now = new Date();
        const resetTime = new Date();
        resetTime.setHours(2, 0, 0, 0);

        if (now > resetTime) {
            resetTime.setDate(resetTime.getDate() + 1);
        }

        const timeout = resetTime - now;

        setTimeout(() => {
            resetCells();
            scheduleDailyReset(); // Repeat daily
        }, timeout);
    }

    // Reset all cells
    function resetCells() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const key = `${row}-${col}`;
                const cell = gridContainer.children[row * GRID_SIZE + col];
                if (apartmentLayout[row][col]) {
                    cell.classList.remove('clean');
                    cellStates[row][col] = false;
                    localStorage.setItem(key, 'dirty');
                }
            }
        }
    }

    // Load everything on start
    loadSettings();
    initializeGrid();
    scheduleDailyReset();
});

    // Lade alles beim Start
    loadSettings();
    initializeGrid();
    scheduleDailyReset();
});
