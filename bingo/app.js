// Bingo Board Application
class BingoBoard {
    constructor() {
        this.rows = 5;
        this.columns = 5;
        this.pointsPerTile = 10;
        this.bonusPoints = 50;
        this.tiles = [];
        this.currentEditingTile = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Input elements
        this.rowsInput = document.getElementById('rows');
        this.columnsInput = document.getElementById('columns');
        this.pointsPerTileInput = document.getElementById('pointsPerTile');
        this.bonusPointsInput = document.getElementById('bonusPoints');

        // Buttons
        this.createBoardBtn = document.getElementById('createBoard');
        this.addRowBtn = document.getElementById('addRow');
        this.addColumnBtn = document.getElementById('addColumn');
        this.exportBtn = document.getElementById('exportBoard');
        this.importBtn = document.getElementById('importBoard');
        this.fileInput = document.getElementById('fileInput');

        // Board and modal
        this.boardElement = document.getElementById('bingoBoard');
        this.modal = document.getElementById('editModal');
        this.tileTaskInput = document.getElementById('tileTask');
        this.saveTaskBtn = document.getElementById('saveTask');
        this.cancelEditBtn = document.getElementById('cancelEdit');

        // Score displays
        this.totalScoreElement = document.getElementById('totalScore');
        this.completedRowsElement = document.getElementById('completedRows');
        this.completedColumnsElement = document.getElementById('completedColumns');
    }

    attachEventListeners() {
        this.createBoardBtn.addEventListener('click', () => this.createBoard());
        this.addRowBtn.addEventListener('click', () => this.addRow());
        this.addColumnBtn.addEventListener('click', () => this.addColumn());
        this.exportBtn.addEventListener('click', () => this.exportBoard());
        this.importBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.importBoard(e));

        this.saveTaskBtn.addEventListener('click', () => this.saveTask());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    createBoard() {
        this.rows = parseInt(this.rowsInput.value);
        this.columns = parseInt(this.columnsInput.value);
        this.pointsPerTile = parseInt(this.pointsPerTileInput.value);
        this.bonusPoints = parseInt(this.bonusPointsInput.value);

        // Initialize tiles array
        this.tiles = [];
        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.columns; col++) {
                this.tiles[row][col] = {
                    task: '',
                    completed: false
                };
            }
        }

        this.renderBoard();
        this.updateScore();
    }

    renderBoard() {
        if (this.tiles.length === 0) {
            this.boardElement.innerHTML = '<div class="empty-board">Create a board to get started!</div>';
            return;
        }

        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const tile = this.createTileElement(row, col);
                this.boardElement.appendChild(tile);
            }
        }
    }

    createTileElement(row, col) {
        const tileData = this.tiles[row][col];
        const tile = document.createElement('div');
        tile.className = 'bingo-tile';
        if (tileData.completed) {
            tile.classList.add('completed');
        }

        const taskText = document.createElement('div');
        taskText.className = 'tile-task';
        taskText.textContent = tileData.task || 'Click to edit';

        const editHint = document.createElement('div');
        editHint.className = 'tile-edit-hint';
        editHint.textContent = 'Right-click to edit • Left-click to toggle';

        tile.appendChild(taskText);
        tile.appendChild(editHint);

        // Left click to toggle completion
        tile.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTileCompletion(row, col);
        });

        // Right click to edit
        tile.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.openEditModal(row, col);
        });

        return tile;
    }

    toggleTileCompletion(row, col) {
        this.tiles[row][col].completed = !this.tiles[row][col].completed;
        this.renderBoard();
        this.updateScore();
    }

    openEditModal(row, col) {
        this.currentEditingTile = { row, col };
        this.tileTaskInput.value = this.tiles[row][col].task;
        this.modal.classList.add('active');
        this.tileTaskInput.focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.currentEditingTile = null;
        this.tileTaskInput.value = '';
    }

    saveTask() {
        if (this.currentEditingTile) {
            const { row, col } = this.currentEditingTile;
            this.tiles[row][col].task = this.tileTaskInput.value;
            this.renderBoard();
            this.closeModal();
        }
    }

    addRow() {
        if (this.tiles.length === 0) {
            alert('Please create a board first!');
            return;
        }

        const newRow = [];
        for (let col = 0; col < this.columns; col++) {
            newRow.push({
                task: '',
                completed: false
            });
        }
        this.tiles.push(newRow);
        this.rows++;
        this.renderBoard();
    }

    addColumn() {
        if (this.tiles.length === 0) {
            alert('Please create a board first!');
            return;
        }

        for (let row = 0; row < this.rows; row++) {
            this.tiles[row].push({
                task: '',
                completed: false
            });
        }
        this.columns++;
        this.renderBoard();
    }

    updateScore() {
        let totalPoints = 0;
        let completedTiles = 0;

        // Count completed tiles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.tiles[row][col].completed) {
                    completedTiles++;
                }
            }
        }

        // Calculate base points
        totalPoints = completedTiles * this.pointsPerTile;

        // Check for completed rows
        let completedRows = 0;
        for (let row = 0; row < this.rows; row++) {
            let rowComplete = true;
            for (let col = 0; col < this.columns; col++) {
                if (!this.tiles[row][col].completed) {
                    rowComplete = false;
                    break;
                }
            }
            if (rowComplete) {
                completedRows++;
                totalPoints += this.bonusPoints;
            }
        }

        // Check for completed columns
        let completedColumns = 0;
        for (let col = 0; col < this.columns; col++) {
            let colComplete = true;
            for (let row = 0; row < this.rows; row++) {
                if (!this.tiles[row][col].completed) {
                    colComplete = false;
                    break;
                }
            }
            if (colComplete) {
                completedColumns++;
                totalPoints += this.bonusPoints;
            }
        }

        // Update display
        this.totalScoreElement.textContent = totalPoints;
        this.completedRowsElement.textContent = completedRows;
        this.completedColumnsElement.textContent = completedColumns;
    }

    exportBoard() {
        if (this.tiles.length === 0) {
            alert('No board to export! Please create a board first.');
            return;
        }

        const boardData = {
            rows: this.rows,
            columns: this.columns,
            pointsPerTile: this.pointsPerTile,
            bonusPoints: this.bonusPoints,
            tiles: this.tiles
        };

        const dataStr = JSON.stringify(boardData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bingo-board-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importBoard(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const boardData = JSON.parse(e.target.result);

                // Validate the imported data
                if (!boardData.rows || !boardData.columns || !boardData.tiles) {
                    throw new Error('Invalid board data');
                }

                // Load the board data
                this.rows = boardData.rows;
                this.columns = boardData.columns;
                this.pointsPerTile = boardData.pointsPerTile || 10;
                this.bonusPoints = boardData.bonusPoints || 50;
                this.tiles = boardData.tiles;

                // Update input fields
                this.rowsInput.value = this.rows;
                this.columnsInput.value = this.columns;
                this.pointsPerTileInput.value = this.pointsPerTile;
                this.bonusPointsInput.value = this.bonusPoints;

                // Render the board
                this.renderBoard();
                this.updateScore();

                alert('Board imported successfully!');
            } catch (error) {
                alert('Error importing board: ' + error.message);
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }
}

// Initialize the application
let bingoBoard;
document.addEventListener('DOMContentLoaded', () => {
    bingoBoard = new BingoBoard();
});
