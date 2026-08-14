export const ROWS = 7;
export const COLS = 7;

export const TILE_TYPES = {
    EMPTY: "empty",
    PLAYER: "player",
    WALL: "wall",
    GUARD: "guard",
    TRAP: "trap",
    OBJECTIVE: "objective",
};

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

        type: TILE_TYPES.EMPTY,

        walkable: true,

        discovered: false,

        player: false,

        guard: null,
        trap: null,
        item: null,
        objective: null,
    };
}