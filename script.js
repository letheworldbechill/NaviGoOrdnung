document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.querySelector('.close');
    const settingsGrid = document.getElementById('settings-grid');
    const saveSettingsButton = document.getElementById('save-settings');

    const GRID_SIZE = 20;
    let cellStates = [];
    let apartmentLayout = [];

    // Initialisiere Zellen
    function initializeGrid() {
        gridContainer.innerHTML = '';
        for (let row = 0; row < GRID_SIZE; row++) {
            cellStates[row] = [];
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

                // Zelle klicken
                cell.addEventListener('click', () => {
                    cell.classList.toggle('clean');
                    cellStates[row][col] = !cellStates[row][col];
                    localStorage.setItem(key, cellStates[row][col] ? 'clean' : 'dirty');
                });

                // Sichtbarkeit basierend auf Apartment Layout
                if (apartmentLayout[row] && apartmentLayout[row][col]) {
                    cell.style.display = 'block';
                } else {
                    cell.style.display = 'none';
                }

                gridContainer.appendChild(cell);
            }
        }
    }

    // Lade Einstellungen
    function loadSettings() {
        const savedLayout = localStorage.getItem('apartmentLayout');
        if (savedLayout) {
            apartmentLayout = JSON.parse(savedLayout);
        } else {
            // Standard: alle Zellen aktiv
            for (let row = 0; row < GRID_SIZE; row++) {
                apartmentLayout[row] = [];
                for (let col = 0; col < GRID_SIZE; col++) {
                    apartmentLayout[row][col] = true;
                }
            }
        }
    }

    // Initialisiere Einstellungen Modal
    function initializeSettingsModal() {
        settingsGrid.innerHTML = '';
        for (let row = 0; row < 10; row++) { // Beispiel: 10x10 Einstellungen
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.classList.add('settings-cell');
                if (apartmentLayout[row] && apartmentLayout[row][col]) {
                    cell.classList.add('active');
                }

                cell.addEventListener('click', () => {
                    cell.classList.toggle('active');
                    if (!apartmentLayout[row]) apartmentLayout[row] = [];
                    apartmentLayout[row][col] = apartmentLayout[row][col] ? false : true;
                });

                settingsGrid.appendChild(cell);
            }
        }
    }

    // Speichere Einstellungen
    function saveSettings() {
        localStorage.setItem('apartmentLayout', JSON.stringify(apartmentLayout));
        initializeGrid();
        closeSettingsModal();
    }

    // Öffne Einstellungen Modal
    settingsButton.addEventListener('click', () => {
        initializeSettingsModal();
        settingsModal.style.display = 'block';
    });

    // Schließe Einstellungen Modal
    closeModal.addEventListener('click', () => {
        closeSettingsModal();
    });

    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) {
            closeSettingsModal();
        }
    });

    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }

    saveSettingsButton.addEventListener('click', saveSettings);

    // Tägliches Zurücksetzen um 02:00 Uhr
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
            scheduleDailyReset(); // Wiederhole täglich
        }, timeout);
    }

    // Setze alle Zellen zurück
    function resetCells() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const key = `${row}-${col}`;
                const cell = gridContainer.children[row * GRID_SIZE + col];
                if (apartmentLayout[row] && apartmentLayout[row][col]) {
                    cell.classList.remove('clean');
                    cellStates[row][col] = false;
                    localStorage.setItem(key, 'dirty');
                }
            }
        }
    }

    // Lade alles beim Start
    loadSettings();
    initializeGrid();
    scheduleDailyReset();
});
