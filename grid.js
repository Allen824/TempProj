export const ROWS = 6;
export const COLS = 6;

export function createGrid() {
    const grid = [];

    for (let row = 0; row < ROWS; row++) {
        const currentRow = [];

        for (let col = 0; col < COLS; col++) {
            currentRow.push(createTile(row, col));
        }

        grid.push(currentRow);
    }

    return grid;
}

function createTile(row, col) {
    return {
        id: `${row}-${col}`,
        row,
        col,

        number: Math.floor(Math.random() * 6) + 1,
        numberUsed: false
    };
}