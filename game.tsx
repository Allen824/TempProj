import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Button } from "react-native";
import { createGrid } from "./grid";
import { useRouter } from 'expo-router';

const Game = () => {
    const router = useRouter();
    const [grid, setGrid] = useState(() => createGrid());
    const [gridSize, setGridSize] = useState(0);
    const tileSize = gridSize / 7;
    const [playerStartingPosition, setPlayerStartingPosition] = useState({ row: 0, col: 4 });
    const [getPlayerAt, setGetPlayerAt] = useState([{ row: playerStartingPosition.row, col: playerStartingPosition.col }]);
    const playerX = useRef(new Animated.Value(0)).current;
    const playerY = useRef(new Animated.Value(0)).current;

    const [playerCaptured, setPlayerCaptured] = useState(false);
    const [toolBeltLength, setToolBeltLength] = useState(3)
    const [toolBeltItems, setToolBeltItems] = useState<{ name: string; quantity: number }[]>([
    ]);
    const [availableMoves, setAvailableMoves] = useState<{ row: number; col: number }[]>([]);
    const [currentlyMoving, setCurrentlyMoving] = useState(false)
    const [moveLength, setMoveLength] = useState(1)
    const [powerOut, setPowerOut] = useState(false)
    const [switches, setSwitches] = useState({
        red: false,
        blue: false
    });
    const [winTile, setWinTile] = useState({ row: 0, col:   0 })
    const [doorData, setDoorData] = useState([
        {
            id: 1,
            row: 3,
            col: 2,
            isOpen: true,
            powered: true
        },
        {
            id: 2,
            row: 0,
            col: 1,
            isOpen: false,
            powered: false
        },

    ]);
    type Wall = {
        walls: string[];
        brittle: {
            direction: string;
            health: number;
        }[];
        powered?: {
            direction: string;
            source: string;
        }[];
        rotating?: {
            source: string;
            direction: string;
            state: number;
        }
        row: number;
        col: number;
    };
    const [wallData, setWallData] = useState<Wall[]>([
        // Level Divider
        { walls: ["east", "south"], brittle: [], powered: [{direction: "east", source: "grid"}], row: 0, col: 2}, 
        { walls: ["east"], brittle: [], powered: [], row: 1, col: 2 }, 
        { walls: ["east"], brittle: [], powered: [], row: 2, col: 2}, 
        { walls: ["east"], brittle: [], powered: [], row: 4, col: 2},  
        { walls: ["east"], brittle: [], powered: [], row: 5, col: 2}, 
        { walls: ["east"], brittle: [{direction: "east", health: 3}], powered: [], row: 6, col: 2},
        // Starter Room
        { walls: ["south"], brittle: [], row: 1, powered: [{direction: "south", source: "grid"}], col: 4},
        { walls: ["south", "east"], brittle: [], powered: [], row: 1, col: 5},
        //Key Room
        { walls: ["north"], brittle: [], powered: [], row: 6, col: 5},
        { walls: ["north"], brittle: [], powered: [], row: 6, col: 3},
        { walls: ["north", "east"], brittle: [], powered: [], rotating: { source: "grid", direction: "clockwise", state: 0}, row: 6, col: 4},
        // Win Room
        { walls: ["south"], brittle: [], powered: [], row: 0, col: 0},
        { walls: ["south"], brittle: [], powered: [{direction: "south", source: "grid"}], row: 0, col: 1}, 
        //Misc
        { walls: ["east"], brittle: [], powered: [{direction: "east", source: "grid"}], row: 4, col: 4},
        { walls: ["east"], brittle: [], powered: [{direction: "east", source: "grid"}], row: 3, col: 4},
    ]) 
    const [guardData, setGuardData] = useState([
        { id: 1, type: "grunt", state: "patrol", row: 2, col: 0, 
            pattern: "fourway", direction: "north", status: "fine", statusLength: 0, stateLength: 0, suspicionRow: null as number | null,
            suspicionCol: null as number | null,},
       /* { id: 2, type: "officer", state: "patrol", row: 4, col: 5, pattern: "wander", direction: "north", status: "fine", statusLength: 0,
        stateLength: 0, suspicionRow: null as number | null, suspicionCol: null as number | null,
        } */
    ])
    const [cameraData, setCameraData] = useState([
        {
            id: 1,
            row: 5,
            col: 3,
            direction: "north",
            state: "active",
            type: "door",
            controlsDoor: 1
        }
    ]);
    const [cameraDistance, setCameraDistance] = useState([
        {type: "door" , distance: 3}
    ]);
    const [itemData, setItemData] = useState([
    //{ type: 'key', row: 1, col: 4, isCollected: false }, 
    { type: 'blind', row: 1, col: 6, isCollected: false},
    { type: 'key', row: 6, col: 6, isCollected: false}
    ])
    const [powerSquareData, setPowerSquareData] = useState([
    {type: 'grid', row: 5, col: 6},
    {type: 'grid', row: 6, col: 0}])
    const [availableInteractions, setAvailableInteractions] = useState<
    { row: number; col: number; type: string }[]>([]);
    const [currentlyInteracting, setCurrentlyInteracting] = useState(false);
    const [gameActions, setGameActions] = useState<string[]>([]);

    const getActions = () => {
        if (gameActions.length === 0) {
            return null
        }
        else {
            return gameActions.map((action, index) => <Text key={index}>{action}</Text>);
        }
    };

    useEffect(() => {
        if (
            getPlayerAt[0].row === winTile.row &&
            getPlayerAt[0].col === winTile.col
        ) {
            handleWin();
        }
    }, [getPlayerAt]);

    useEffect(() => {
        if (playerCaptured) {
            handleCapture();
        }
    }, [playerCaptured]);

    useEffect(() => {
        if (gridSize > 0) {
            const playerSize = 40;

            playerX.setValue(
                playerStartingPosition.col * tileSize +
                (tileSize - playerSize) / 2
            );

            playerY.setValue(
                playerStartingPosition.row * tileSize +
                (tileSize - playerSize) / 2
            );
        }
    }, [gridSize]);

    const handleWin = () => {
        console.log("You win!");
        router.replace('/win');
    }

    const handleCapture = () => {
        console.log("You are in capture range")
        router.replace('/lose');
    }
    const getOccupied = (row: number, col: number) => {
        const item = getItemData(row, col);

        const camera = getCameraData(row, col);

        if (camera) {
            if (camera.state === "active") {
                return "CAM";
            }

            else if (camera.state === "alert") {
                return "!CAM!";
            }
            else if (camera.state === "inactive") {
                return "IAC"
            }
        }

        if (getGuardData(row, col)) {
            return "guard";
        }

        if(getDoorData(row, col)) {
            const door = getDoorData(row, col);
            let doorString = "D"
            if (door?.isOpen) {
                doorString += "(o)"
            }
            if (door?.powered) {
                doorString += "(p)"
            }
            return doorString
        }

        if (item && !item.isCollected) {
            if (!powerOut) {
                return item.type.toUpperCase();
            }
        }

        const wall = getWallData(row, col);

        if (wall?.rotating) {
            if (wall.rotating.direction === "clockwise") {
                return "↻";
            }

            if (wall.rotating.direction === "counterclockwise") {
                return "↺";
            }
        }
    };

    const getWinTile = (row: number, col: number) => {
        return winTile.row === row && winTile.col === col;
    }
    const getDoorData = (row: number, col: number) => {
        return doorData.find((door) => door.row === row && door.col === col);
    }

    const getWallData = (row: number, col: number) => {
        return wallData.find((wall) => wall.row === row && wall.col === col);
    }

    const getPowerGridData = (row: number, col: number) => {
        return powerSquareData.find((tile) => tile.row === row && tile.col === col)
    }

    const getGuardData = (row: number, col: number) => {
        return guardData.find((guard) => guard.row === row && guard.col === col);
    }

    const getCameraData = (row: number, col: number) => {
        return cameraData.find((camera) => camera.row === row && camera.col === col);
    }

    const getGuardVisuals = (row: number, col: number, text: boolean) => {
        const guard = guardData.find(
            (guard) => guard.row === row && guard.col === col
        );

        if (!guard) {
            return null;
        }

        let returnText = ''

        if (guard.state === "patrol") {
            returnText = (text) ? "-" : "neutral"
            return returnText    
        }

        if (guard.state === "suspicion") {
            returnText = (text) ? "?" : "suspicion"
            return returnText
        }

        if (guard.state === "alert") {
            returnText = (text) ? "!" : "alert"
            return returnText
        }

        return null;
    };

    const getItemData = (row: number, col: number) => {
        return itemData.find(
            item => item.row === row && item.col === col
        );
    };

    const getItemExist = (type: string) => {
        return itemData.find(
            itemData => itemData.type === type
        )
    }

    const getPowerTileData = (row: number, col: number) => {
        return powerSquareData.find(
            powerSquareData => powerSquareData.row === row && powerSquareData.col === col
        )
    }
    /*
    const isPowered = (poweredWall: {
        source: string;
        statusOn: boolean;
    }) => {
        if (poweredWall.source === "grid") {
            return !powerOut;
        }

        return poweredWall.statusOn;
    };
    */
    const isWallActive = (
        wall: typeof wallData[number] | undefined,
        direction: string
    ) => {
        if (!wall) return false;

        if (!wall.walls.includes(direction)) {
            return false;
        }

        const poweredWall = wall.powered?.find(
            power => power.direction === direction
        );

        if (!poweredWall) {
            return true;
        }

        if (poweredWall.source === "grid") {
            return !powerOut;
        }

        return true;
    };



    const getCurrentState = () => {
        if(currentlyMoving) {
            return "Moving"
        }
        else if(currentlyInteracting) {
            return "Interacting"
        }
        else {
            return "Idle"
        }
    }

    const advanceTurn = (row: number, col: number) => {

        advanceGuards(row, col);
        updateCameras(row, col)
        rotatePoweredWalls();
    };

    const rotatePoweredWalls = () => {
        if (powerOut) return;

        setWallData(prev =>
            prev.map(wall => {

                if (!wall.rotating) {
                    return wall;
                }

                if (wall.rotating.source !== "grid") {
                    return wall;
                }

                const newState =
                    wall.rotating.direction === "clockwise"
                        ? (wall.rotating.state + 1) % 4
                        : (wall.rotating.state + 3) % 4;

                const rotations = [
                    ["north", "east"],
                    ["east", "south"],
                    ["south", "west"],
                    ["west", "north"]
                ];

                return {
                    ...wall,
                    walls: rotations[newState],
                    rotating: {
                        ...wall.rotating,
                        state: newState
                    }
                };
            })
        );
    };

    const advanceGuards = (row: number, col: number) => {
        setGuardData(prev =>
            prev.map(guard => {
                if(guard.state === "alert") {
                    let newRow = guard.row;
                    let newCol = guard.col;

                    const directions = [
                        { name: "north", row: -1, col: 0 },
                        { name: "south", row: 1, col: 0 },
                        { name: "west", row: 0, col: -1 },  
                        { name: "east", row: 0, col: 1 }
                    ];

                    const openSpaces = directions.filter(dir => {
                        const nextRow = guard.row + dir.row;
                        const nextCol = guard.col + dir.col;

                        return (
                            nextRow >= 0 &&
                            nextRow < grid.length &&
                            nextCol >= 0 &&
                            nextCol < grid[0].length &&
                            notObstructed(nextRow, nextCol) &&
                            canMove(guard.row, guard.col, nextRow, nextCol)

                        );
                    });

                    if (openSpaces.length > 0) {
                        const rowDistance = Math.abs(guard.row - row);
                        const colDistance = Math.abs(guard.col - col);

                        let preferredDirection;

                        if (rowDistance >= colDistance) {
                            preferredDirection = row < guard.row ? "north" : "south";
                        } else {
                            preferredDirection = col < guard.col ? "west" : "east";
                        }

                        let move = openSpaces.find(
                            dir => dir.name === preferredDirection
                        );

                        if (!move) {
                            if (rowDistance >= colDistance) {
                                const alternateDirection =
                                    col < guard.col ? "west" : "east";

                                move = openSpaces.find(
                                    dir => dir.name === alternateDirection
                                );
                            } else {
                                const alternateDirection =
                                    row < guard.row ? "north" : "south";

                                move = openSpaces.find(
                                    dir => dir.name === alternateDirection
                                );
                            }
                        }

                        if (move) {
                            newRow = guard.row + move.row;
                            newCol = guard.col + move.col;
                        }
                    }

                    const distance =
                        Math.abs(newRow - row) +
                        Math.abs(newCol - col);

                    if (
                        distance === 0 ||
                        (distance === 1 && canMove(newRow, newCol, row, col))
                    ) {
                        setPlayerCaptured(true)
                    }

                    return {
                        ...guard,
                        row: newRow,
                        col: newCol,
                    }
                }
                else if (guard.state === "suspicion") {
                    if (guard.suspicionRow === null || guard.suspicionCol === null) {
                        return guard;
                    }
                    let newRow = guard.row;
                    let newCol = guard.col;

                    if (
                        guard.row === guard.suspicionRow &&
                        guard.col === guard.suspicionCol
                    ) {
                        if (guard.stateLength > 0) {
                            const spottedPlayer = canSuspicionGuardSeePlayer(
                                guard,
                                row,
                                col
                            );

                            if (spottedPlayer) {
                                return {
                                    ...guard,
                                    state: "alert",
                                    stateLength: 0,
                                    suspicionRow: null,
                                    suspicionCol: null
                                };
                            }

                            return {
                                ...guard,
                                stateLength: guard.stateLength - 1
                            };
                        }

                        return {
                            ...guard,
                            state: "patrol",
                            stateLength: 0,
                            suspicionRow: null,
                            suspicionCol: null
                        };
                    }

                    const directions = [
                        { name: "north", row: -1, col: 0 },
                        { name: "south", row: 1, col: 0 },
                        { name: "west", row: 0, col: -1 },
                        { name: "east", row: 0, col: 1 }
                    ];

                    const openSpaces = directions.filter(dir => {
                        const nextRow = guard.row + dir.row;
                        const nextCol = guard.col + dir.col;

                        return (
                            nextRow >= 0 &&
                            nextRow < grid.length &&
                            nextCol >= 0 &&
                            nextCol < grid[0].length &&
                            notObstructed(nextRow, nextCol) &&
                            canMove(guard.row, guard.col, nextRow, nextCol)
                        );
                    });

                    if (openSpaces.length > 0) {
                        const rowDistance = Math.abs(
                            guard.row - guard.suspicionRow
                        );

                        const colDistance = Math.abs(
                            guard.col - guard.suspicionCol
                        );

                        let preferredDirection;

                        if (rowDistance >= colDistance) {
                            preferredDirection =
                                guard.suspicionRow < guard.row
                                    ? "north"
                                    : "south";
                        } else {
                            preferredDirection =
                                guard.suspicionCol < guard.col
                                    ? "west"
                                    : "east";
                        }

                        let move = openSpaces.find(
                            dir => dir.name === preferredDirection
                        );

                        if (!move) {
                            if (rowDistance >= colDistance) {
                                const alternateDirection =
                                    guard.suspicionCol < guard.col
                                        ? "west"
                                        : "east";

                                move = openSpaces.find(
                                    dir => dir.name === alternateDirection
                                );
                            } else {
                                const alternateDirection =
                                    guard.suspicionRow < guard.row
                                        ? "north"
                                        : "south";

                                move = openSpaces.find(
                                    dir => dir.name === alternateDirection
                                );
                            }
                        }

                        if (move) {
                            newRow = guard.row + move.row;
                            newCol = guard.col + move.col;
                        }
                    }

                    const updatedGuard = {
                        ...guard,
                        row: newRow,
                        col: newCol
                    };

                    const spottedPlayer = canSuspicionGuardSeePlayer(
                        updatedGuard,
                        row,
                        col
                    );

                    const reachedSuspicionLocation =
                        newRow === guard.suspicionRow &&
                        newCol === guard.suspicionCol;

                    return {
                        ...guard,
                        row: newRow,
                        col: newCol,

                        state: spottedPlayer
                            ? "alert"
                            : reachedSuspicionLocation
                                ? "suspicion"
                                : guard.state,

                        stateLength: reachedSuspicionLocation
                            ? 1
                            : guard.stateLength,

                        suspicionRow: spottedPlayer
                            ? null
                            : reachedSuspicionLocation
                                ? guard.suspicionRow
                                : guard.suspicionRow,

                        suspicionCol: spottedPlayer
                            ? null
                            : reachedSuspicionLocation
                                ? guard.suspicionCol
                                : guard.suspicionCol
                    };
                }

            else if (guard.pattern === "wander") {
                let newRow = guard.row;
                let newCol = guard.col;

                const directions = [
                    { name: "north", row: -1, col: 0 },
                    { name: "south", row: 1, col: 0 },
                    { name: "west", row: 0, col: -1 },
                    { name: "east", row: 0, col: 1 }
                ];

                const openSpaces = directions.filter(dir => {
                    const nextRow = guard.row + dir.row;
                    const nextCol = guard.col + dir.col;

                    return (
                        nextRow >= 0 &&
                        nextRow < grid.length &&
                        nextCol >= 0 &&
                        nextCol < grid[0].length &&
                        notObstructed(nextRow, nextCol) &&
                        canMove(guard.row, guard.col, nextRow, nextCol)

                    );
                });

                if (openSpaces.length > 0) {
                    const randomMove = openSpaces[Math.floor(Math.random() * openSpaces.length)];

                    newRow = guard.row + randomMove.row;
                    newCol = guard.col + randomMove.col;
                }

                let newDirection = guard.direction;

                const validDirections = directions.filter(dir => {
                    const nextRow = newRow + dir.row;
                    const nextCol = newCol + dir.col;

                    return (
                        nextRow >= 0 &&
                        nextRow < grid.length &&
                        nextCol >= 0 &&
                        nextCol < grid[0].length &&
                        notObstructed(nextRow, nextCol) &&
                        canMove(newRow, newCol, nextRow, nextCol)
                    );
                });

                if (validDirections.length > 0) {
                    const sameDirection = validDirections.find(
                        dir => dir.name === guard.direction
                    );

                    if (sameDirection && Math.random() < 0.7) {
                        newDirection = guard.direction;
                    } else {
                        const choices = validDirections.filter(
                            dir => dir.name !== guard.direction
                        );

                        if (choices.length > 0) {
                            newDirection = choices[Math.floor(Math.random() * choices.length)].name;
                        }
                    }
                }

                const updatedGuard = {
                    ...guard,
                    row: newRow,
                    col: newCol,
                    direction: newDirection
                };

                const spottedPlayer = canGuardSeePlayer(updatedGuard, row, col);

                return {
                    ...guard,
                    row: newRow,
                    col: newCol,
                    direction: newDirection,
                    state: spottedPlayer ? "suspicion" : guard.state,
                    statusLength: guard.status === "Blind"
                        ? guard.statusLength - 1
                        : guard.statusLength,
                    status: guard.status === "Blind" && guard.statusLength - 1 <= 0
                        ? "fine"
                        : guard.status,
                    stateLength: spottedPlayer ? guard.stateLength + 1 : guard.stateLength,
                    suspicionRow: spottedPlayer ? row : guard.suspicionRow,
                    suspicionCol: spottedPlayer ? col : guard.suspicionCol,
                    
                };
            }
            else if (guard.pattern === "fourway") {
                let newDirection = guard.direction;

                switch (guard.direction) {
                    case "north":
                        newDirection = "east";
                        break;
                    case "east":
                        newDirection = "south";
                        break;
                    case "south":
                        newDirection = "west";
                        break;
                    case "west":
                        newDirection = "north";
                        break;
                }

                const updatedGuard = {
                    ...guard,
                    direction: newDirection
                };

                const spottedPlayer = canGuardSeePlayer(updatedGuard, row, col);

                return {
                    ...guard,
                    direction: newDirection,
                    state: spottedPlayer ? "suspicion" : guard.state,
                    statusLength: guard.status === "Blind"
                        ? guard.statusLength - 1
                        : guard.statusLength,
                    status: guard.status === "Blind" && guard.statusLength - 1 <= 0
                        ? "fine"
                        : guard.status,
                    stateLength: spottedPlayer ? guard.stateLength + 1 : guard.stateLength,
                    suspicionRow: spottedPlayer ? row : guard.suspicionRow,
                    suspicionCol: spottedPlayer ? col : guard.suspicionCol,
                    
                };
            }
                return guard;
            })
        );
    };  

    const updateCameras = (row: number, col: number) => {
        setCameraData(prev =>
            prev.map(camera => {
                const spottedPlayer = canCameraSeePlayer(
                    camera,
                    row,
                    col
                );

                if (spottedPlayer) {
                    if (camera.state !== "alert") {
                        if (camera.controlsDoor !== undefined) {
                            setDoorData(prevDoors =>
                                prevDoors.map(door =>
                                    door.id === camera.controlsDoor
                                        ? { ...door, isOpen: false }
                                        : door
                                )
                            );
                        }
                    }

                    return {
                        ...camera,
                        state: "alert"
                    };
                }

                if (camera.state === "alert") {
                    if (camera.controlsDoor !== undefined) {
                        setDoorData(prevDoors =>
                            prevDoors.map(door =>
                                door.id === camera.controlsDoor
                                    ? { ...door, isOpen: true }
                                    : door
                            )
                        );
                    }

                    return {
                        ...camera,
                        state: "active"
                    };
                }

                return camera;
            })
        );
    };

    const canCameraSeePlayer = (
        camera: {
            row: number;
            col: number;
            direction: string;
            state: string;
            type: string;
        },
        playerRow: number,
        playerCol: number
    ) => {
        if (camera.state === "inactive") {
            return false;
        }

        const maxDistance =
            cameraDistance.find(d => d.type === camera.type)?.distance || 0;

        let currentDistance = 0;
        let checkRow = camera.row;
        let checkCol = camera.col;

        while (currentDistance < maxDistance) {
            let nextRow = checkRow;
            let nextCol = checkCol;

            if (camera.direction === "north") {
                nextRow--;
            } else if (camera.direction === "south") {
                nextRow++;
            } else if (camera.direction === "east") {
                nextCol++;
            } else if (camera.direction === "west") {
                nextCol--;
            }

            if (
                nextRow < 0 ||
                nextRow >= grid.length ||
                nextCol < 0 ||
                nextCol >= grid[0].length
            ) {
                return false;
            }

            if (!canMove(checkRow, checkCol, nextRow, nextCol)) {
                return false;
            }

            checkRow = nextRow;
            checkCol = nextCol;
            currentDistance++;

            if (
                checkRow === playerRow &&
                checkCol === playerCol
            ) {
                return true;
            }
        }

        return false;
    };

     const canGuardSeePlayer = (
        guard: {
            row: number;
            col: number;
            state: string;
            direction: string;
            status: string;
        },
        playerRow: number,
        playerCol: number
    ) => {
        let checkRow = guard.row;
        let checkCol = guard.col;

        if (guard.status === "Blind") {
            return false;
        }
            while (true) {
                let nextRow = checkRow;
                let nextCol = checkCol;

                if (guard.direction === "north") {
                    nextRow--;
                } else if (guard.direction === "south") {
                    nextRow++;
                } else if (guard.direction === "east") {
                    nextCol++;
                } else if (guard.direction === "west") {
                    nextCol--;
                }

                if (
                    nextRow < 0 ||
                    nextRow >= grid.length ||
                    nextCol < 0 ||
                    nextCol >= grid[0].length
                ) {
                    return false;
                }

                if (!canMove(checkRow, checkCol, nextRow, nextCol)) {
                    return false;
                }

                checkRow = nextRow;
                checkCol = nextCol;

                if (
                    checkRow === playerRow &&
                    checkCol === playerCol
                ) {
                    return true;
                }
        }

    };

   const canSuspicionGuardSeePlayer = (
        guard: {
            row: number;
            col: number;
            status: string;
        },
        playerRow: number,
        playerCol: number
    ) => {
        if (guard.status === "Blind") {
            return false;
        }

        const adjacentDirections = [
            { row: -1, col: 0 }, 
            { row: 1, col: 0 },  
            { row: 0, col: -1 },
            { row: 0, col: 1 },   
            { row: -1, col: -1 },
            { row: -1, col: 1 }, 
            { row: 1, col: -1 }, 
            { row: 1, col: 1 }   
        ];

        for (const direction of adjacentDirections) {
            const nextRow = guard.row + direction.row;
            const nextCol = guard.col + direction.col;

            if (
                nextRow < 0 ||
                nextRow >= grid.length ||
                nextCol < 0 ||
                nextCol >= grid[0].length
            ) {
                continue;
            }

            if (!canMove(guard.row, guard.col, nextRow, nextCol)) {
                continue;
            }

            if (
                nextRow === playerRow &&
                nextCol === playerCol
            ) {
                return true;
            }
        }

        
        const cardinalDirections = [
            { row: -1, col: 0 }, 
            { row: 1, col: 0 },  
            { row: 0, col: -1 }, 
            { row: 0, col: 1 }   
        ];

        for (const direction of cardinalDirections) {
            const middleRow = guard.row + direction.row;
            const middleCol = guard.col + direction.col;

            const nextRow = guard.row + direction.row * 2;
            const nextCol = guard.col + direction.col * 2;

            if (
                nextRow < 0 ||
                nextRow >= grid.length ||
                nextCol < 0 ||
                nextCol >= grid[0].length
            ) {
                continue;
            }

            
            if (!canMove(guard.row, guard.col, middleRow, middleCol)) {
                continue;
            }

            
            if (!canMove(middleRow, middleCol, nextRow, nextCol)) {
                continue;
            }

            if (
                nextRow === playerRow &&
                nextCol === playerCol
            ) {
                return true;
            }
        }

        return false;
    };

    /*const getGuardVision = (row: number, col: number) => {
        return guardData.find(guard => {
            let checkRow = guard.row;
            let checkCol = guard.col;

            if (guard.status === "Blind") {
                return false;
            }

            while (true) {
                let nextRow = checkRow;
                let nextCol = checkCol;

                if (guard.direction === "north") {
                    nextRow--;
                } else if (guard.direction === "south") {
                    nextRow++;
                } else if (guard.direction === "east") {
                    nextCol++;
                } else if (guard.direction === "west") {
                    nextCol--;
                }

                if (
                    nextRow < 0 ||
                    nextRow >= grid.length ||
                    nextCol < 0 ||
                    nextCol >= grid[0].length
                ) {
                    return false;
                }

                if (!canMove(checkRow, checkCol, nextRow, nextCol)) {
                    return false;
                }

                checkRow = nextRow;
                checkCol = nextCol;

                if (checkRow === row && checkCol === col) {
                    return true;
                }
            }
        });
    }; */

    const isGuardVision = (row: number, col: number) => {
        for (const guard of guardData) {
            let checkRow = guard.row;
            let checkCol = guard.col;

            if (guard.status === "Blind") {
                continue;
            }

            if (guard.state === "alert") {
                if (
                    Math.abs(checkRow - row) +
                    Math.abs(checkCol - col) === 1
                ) {
                    if (canMove(checkRow, checkCol, row, col)) {
                        return "red";
                    }
                }
            }

            else if (guard.state === "suspicion") {
                if (canSuspicionGuardSeePlayer(guard, row, col)) {
                    return "yellow";
                }
            }

            else {
                while (true) {
                    let nextRow = checkRow;
                    let nextCol = checkCol;

                    if (guard.direction === "north") {
                        nextRow--;
                    } else if (guard.direction === "south") {
                        nextRow++;
                    } else if (guard.direction === "east") {
                        nextCol++;
                    } else if (guard.direction === "west") {
                        nextCol--;
                    }

                    if (
                        nextRow < 0 ||
                        nextRow >= grid.length ||
                        nextCol < 0 ||
                        nextCol >= grid[0].length
                    ) {
                        break;
                    }

                    if (!canMove(checkRow, checkCol, nextRow, nextCol)) {
                        break;
                    }

                    checkRow = nextRow;
                    checkCol = nextCol;

                    if (checkRow === row && checkCol === col) {
                        return "yellow";
                    }
                }
            }
        }
    };

    const isCameraVision = (row: number, col: number) => {
        for (const camera of cameraData) {

            if (camera.state === "inactive") {
                continue;
            }

            const maxDistance =
                cameraDistance.find(d => d.type === camera.type)?.distance || 0;

            let checkRow = camera.row;
            let checkCol = camera.col;

            let currentDistance = 0;

            while (currentDistance < maxDistance) {
                let nextRow = checkRow;
                let nextCol = checkCol;

                if (camera.direction === "north") {
                    nextRow--;
                } else if (camera.direction === "south") {
                    nextRow++;
                } else if (camera.direction === "east") {
                    nextCol++;
                } else if (camera.direction === "west") {
                    nextCol--;
                }

                if (
                    nextRow < 0 ||
                    nextRow >= grid.length ||
                    nextCol < 0 ||
                    nextCol >= grid[0].length
                ) {
                    break;
                }

                if (!canMove(checkRow, checkCol, nextRow, nextCol)) {
                    break;
                }

                checkRow = nextRow;
                checkCol = nextCol;
                currentDistance++;

                if (checkRow === row && checkCol === col) {
                    return camera.state === "alert"
                        ? "red"
                        : "yellow";
                }
            }
        }
    };


    const notObstructed = (row: number, col: number) => {
        if(getDoorData(row, col) && !getDoorData(row, col)?.isOpen) {
            return false;
        }
        else if(getGuardData(row, col)) {
            return false;
        }
        return true
    }

    const canMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {

        if (Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) !== 1) {
            return false;
        }

        if(getDoorData(toRow, toCol)?.isOpen === false) {
            return false
        }

        const currentWall = getWallData(fromRow, fromCol);
        const destinationWall = getWallData(toRow, toCol);


        if (toRow < fromRow) {
            if (
                isWallActive(currentWall, "north") ||
                isWallActive(destinationWall, "south")
            ) {
                return false;
            }
        }

        if (toRow > fromRow) {
            if (
                isWallActive(currentWall, "south") ||
                isWallActive(destinationWall, "north")
            ) {
                return false;
            }
        }

        if (toCol > fromCol) {
            if (
                isWallActive(currentWall, "east") ||
                isWallActive(destinationWall, "west")
            ) {
                return false;
            }
        }

        if (toCol < fromCol) {
            if (
                isWallActive(currentWall, "west") ||
                isWallActive(destinationWall, "east")
            ) {
                return false;
            }
        }

        return true;
    };

    const showAvailableMoves = () => {
        setCurrentlyMoving(true)
        const player = getPlayerAt[0];
        const moves: { row: number; col: number }[] = [];

        if (player.row > 0 && notObstructed(player.row - moveLength, player.col) 
            && canMove(player.row, player.col, player.row - moveLength, player.col))
            moves.push({ row: player.row - moveLength, col: player.col });

        if (player.row < grid[0].length - 1 && notObstructed(player.row + moveLength, player.col) 
            && canMove(player.row, player.col, player.row + moveLength, player.col))
            moves.push({ row: player.row + moveLength, col: player.col });

        if (player.col > 0 && notObstructed(player.row, player.col - moveLength) 
            && canMove(player.row, player.col, player.row, player.col - moveLength))
            moves.push({ row: player.row, col: player.col - moveLength });

        if (player.col < grid[0].length - 1 && notObstructed(player.row, player.col + moveLength ) 
            && canMove(player.row, player.col, player.row, player.col + moveLength))
            moves.push({ row: player.row, col: player.col + moveLength });

        setAvailableMoves(moves);

        return moves
    };

    const handleInteractionPress = (row: number, col: number) => {
        const interaction = availableInteractions.find(
            item => item.row === row && item.col === col
        );

        if (!interaction) return;

        switch (interaction.type) {
            case "door":

                const key = toolBeltItems.find(item => item.name === "key");

                if (!key || key.quantity <= 0) return;

                setDoorData(prev =>
                    prev.map(door =>
                        door.row === row && door.col === col 
                            ? { ...door, isOpen: true }
                            : door
                    )
                );

                setToolBeltItems(prev =>
                    prev.map(item =>
                        item.name === "key"
                            ? { ...item, quantity: item.quantity - 1 }
                            : item
                    )
                );

                setGameActions([`Door opened at (${row}, ${col})`]);
                advanceTurn(row, col)
                break;
            case "blind":

                const blind = toolBeltItems.find(item => item.name === "blind")

                if(!blind || blind.quantity <= 0) return

                setGuardData(prev => 
                    prev.map(guard => 
                        guard.row === row && guard.col === col 
                            ? {...guard, status: "Blind", statusLength: 2, state: "patrol"}
                            : guard
                    )
                )


                setToolBeltItems(prev =>
                    prev.map(item =>
                        item.name === "blind"
                            ? { ...item, quantity: item.quantity - 1 }
                            : item
                    )
                );

                break
            case "wall":
                setWallData(prev =>
                    prev.map(wall => {
                        if (wall.row !== row || wall.col !== col) {
                            return wall;
                        }

                        const brittleWall = wall.brittle[0];

                        if (!brittleWall) {
                            return wall;
                        }

                        const newHealth = brittleWall.health - 1;

                        if (newHealth <= 0) {
                            return {
                                ...wall,
                                walls: wall.walls.filter(
                                    direction => direction !== brittleWall.direction
                                ),
                                brittle: wall.brittle.filter(
                                    b => b.direction !== brittleWall.direction
                                )
                            };
                        }

                        return {
                            ...wall,
                            brittle: [
                                {
                                    ...brittleWall,
                                    health: newHealth
                                }
                            ]
                        };
                    })
                    
                );
                advanceTurn(row, col);
                break;
        }
        

        setAvailableInteractions([]);
        setCurrentlyInteracting(false);
    };


    const showAvailableInteractions = () => {
        const player = getPlayerAt[0];
        let tempInteractions = []

        if(getItemExist("key")) {
            const doorInteractions = doorData
            .filter(
                door =>
                    !door.isOpen &&
                    !door.powered &&
                    Math.abs(door.row - player.row) +
                    Math.abs(door.col - player.col) === 1
            )
            .map(door => ({
                row: door.row,
                col: door.col,
                type: "door"
            }));

            tempInteractions.push(...doorInteractions)

        }
        

        const wallInteractions = wallData
            .filter(
                wall =>
                    wall.brittle.length > 0 &&
                    Math.abs(wall.row - player.row) +
                    Math.abs(wall.col - player.col) === 1
            )
            .map(wall => ({
                row: wall.row,
                col: wall.col,
                type: "wall"
            }));
        if(getItemExist("blind")) {
            const guardInteractions = guardData
                .map(guard => ({
                    row: guard.row,
                    col: guard.col, 
                    type: "blind"

            }))
            tempInteractions.push(...guardInteractions)
        }
        
        tempInteractions.push(...wallInteractions)
        setAvailableInteractions(tempInteractions);
        setCurrentlyInteracting(true);
    };


    const isAvailableMove = (row: number, col: number) => {
        return availableMoves.some(
            move => move.row === row && move.col === col
        );
    };

    const isAvailableInteraction = (row:number, col:number) => {
        return availableInteractions.some(
            interaction =>
                interaction.row === row &&
                interaction.col === col
        );
    };

    const movePlayer = (row: number, col: number) => {
        const playerSize = 40;

        const targetX =
            col * tileSize +
            (tileSize - playerSize) / 2;

        const targetY =
            row * tileSize +
            (tileSize - playerSize) / 2;

        Animated.parallel([
            Animated.timing(playerX, {
                toValue: targetX,
                duration: 300,
                useNativeDriver: true,
            }),

            Animated.timing(playerY, {
                toValue: targetY,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {

            setGetPlayerAt([{ row, col }]);

            setAvailableMoves([]);
            setCurrentlyMoving(false);

            setAvailableInteractions([]);
            setCurrentlyInteracting(false);

            if (!powerOut) {
                const item = getItemData(row, col);

                if (item && !item.isCollected) {
                    setToolBeltItems(prev => {
                        const existingItem = prev.find(
                            toolItem => toolItem.name === item.type
                        );

                        if (existingItem) {
                            return prev.map(toolItem =>
                                toolItem.name === item.type
                                    ? {
                                        ...toolItem,
                                        quantity: toolItem.quantity + 1
                                    }
                                    : toolItem
                            );
                        }

                        return [
                            ...prev,
                            {
                                name: item.type,
                                quantity: 1
                            }
                        ];
                    });

                    setItemData(prev =>
                        prev.map(currentItem =>
                            currentItem.row === row &&
                            currentItem.col === col
                                ? {
                                    ...currentItem,
                                    isCollected: true
                                }
                                : currentItem
                        )
                    );
                }
            }

            const powerTile = getPowerTileData(row, col);

            if (powerTile && powerTile.type === "grid") {
                setPowerOut(prev => !prev);
            }

            const camera = getCameraData(row, col);

            if (camera && camera.state === "active") {
                setCameraData(prev =>
                    prev.map(currentCamera =>
                        currentCamera.id === camera.id
                            ? { ...currentCamera, state: "inactive" }
                            : currentCamera
                    )
                );
            }

            advanceTurn(row, col);
        });
    };

    const handleTilePress = (row: number, col: number) => {
        
        if(row === getPlayerAt[0].row && col === getPlayerAt[0].col) {
            const moves = showAvailableMoves();
            if(moves.length === 0) {
                advanceTurn(row, col)
            }
            return
        }
        if (currentlyMoving && isAvailableMove(row, col)) {
            movePlayer(row, col);
        }
    };


    const cancelMove = () => {
        setAvailableMoves([]);
        setCurrentlyMoving(false);

        setAvailableInteractions([]);
        setCurrentlyInteracting(false);
    };

    const getVisuals = (row: number, col: number) => {
        if (getDoorData(row, col)) {
            return getDoorData(row, col)?.isOpen ? "Opendoor" : "Closeddoor";
        }
        if(getWinTile(row, col)) {
            return "WinTile"
        }
        if(getPowerGridData(row, col)) {
            return "powerGridTile"
        }
        return "Empty"
    }

    const getNorthWallStyle = (row: number, col: number) => {
        const wall = getWallData(row, col);

        if (!wall?.walls.includes("north")) {
            return undefined;
        }

        if (wall.brittle.some(b => b.direction === "north")) {
            return styles.northBrittleWall;
        }

        if (wall.powered?.some(b => b.direction === "north")) {
            if(isWallActive(wall, "north")) {
                return styles.northPowerWall
            }
            return 
        }

        return styles.northWall;
    };

    const getSouthWallStyle = (row: number, col: number) => {
        const wall = getWallData(row, col);

        if (!wall?.walls.includes("south")) {
            return undefined;
        }

        if (wall.brittle.some(b => b.direction === "south")) {
            return styles.southBrittleWall;
        }

        if (wall.powered?.some(b => b.direction === "south")) {
            if(isWallActive(wall, "south")) {
                return styles.southPowerWall
            }
            return 
        }

        return styles.southWall;
    };

    const getEastWallStyle = (row: number, col: number) => {
        const wall = getWallData(row, col);

        if (!wall?.walls.includes("east")) {
            return undefined;
        }

        if (wall.brittle.some(b => b.direction === "east")) {
            return styles.eastBrittleWall;
        }

        if (wall.powered?.some(b => b.direction === "east")) {
            if(isWallActive(wall, "east")) {
                return styles.eastPowerWall
            }
            return 
        }

        return styles.eastWall;
    };

    const getWestWallStyle = (row: number, col: number) => {
        const wall = getWallData(row, col);

        if (!wall?.walls.includes("west")) {
            return undefined;
        }

        if (wall.brittle.some(b => b.direction === "west")) {
            return styles.westBrittleWall;
        }

        if (wall.powered?.some(b => b.direction === "west")) {
            if(isWallActive(wall, "west")) {
                return styles.westPowerWall
            }
            return 
        }

        return styles.westWall;
    };

    return (
        <View style={styles.container}>
            <View style={styles.controls}>
                <View>
                    <Text>{isGuardVision(getPlayerAt[0].row, getPlayerAt[0].col) ? "Spotted!" : "Safe"}</Text>
                    <Text>
                        Walls: {getWallData(getPlayerAt[0].row, getPlayerAt[0].col)?.walls.join(", ") ?? "None"}
                    </Text>
                </View>
                    {currentlyInteracting ? (
                        <>
                            <Pressable
                                style={styles.controlButton}
                                onPress={() => cancelMove()}
                            >
                                <Text>Cancel Interaction</Text>
                            </Pressable>
                        </>
                    ) :  currentlyMoving ? (
                        <>
                            <Pressable
                                style={styles.controlButton}
                                onPress={() => cancelMove()}
                            >
                                <Text>Cancel Move</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <View
                                style={styles.controlButton}
                            >
                                <Text></Text>
                            </View>
                        </>
                    )}
            </View>
        <View
            style={styles.grid}
            onLayout={(event) => {
                setGridSize(event.nativeEvent.layout.width);
            }}
        >
                {grid.map((row) => (
                    <View key={row[0].row} style={styles.row}>
                        {row.map((tile) => {
                            const occupied = getOccupied(tile.row, tile.col);

                            return (
                                <Pressable
                                    key={tile.id}
                                    style={[
                                        styles.tile,

                                        powerOut && styles.powerOutTile,
                                        !powerOut && styles.powerOnTile,

                                        getNorthWallStyle(tile.row, tile.col),
                                        getSouthWallStyle(tile.row, tile.col),
                                        getEastWallStyle(tile.row, tile.col),
                                        getWestWallStyle(tile.row, tile.col),

                                        isCameraVision(tile.row, tile.col) === "yellow" && styles.cameraVision,
                                        isCameraVision(tile.row, tile.col) === "red" && styles.alertCameraVision,

                                        isGuardVision(tile.row, tile.col) === "yellow" && styles.guardVision,
                                        isGuardVision(tile.row, tile.col) === "red" && styles.alertVision,

                                        isAvailableMove(tile.row, tile.col) && styles.availableTile,
                                        isAvailableInteraction(tile.row, tile.col) && styles.interactionTile,
          
                                        getVisuals(tile.row, tile.col) === "Opendoor" && styles.doorTileOpen,
                                        getVisuals(tile.row, tile.col) === "Closeddoor" && styles.doorTileClosed,
                                        getVisuals(tile.row, tile.col) === "WinTile" && styles.winTile,
                                        getVisuals(tile.row, tile.col) === "powerGridTile" && styles.gridPowerSwitchTile,
                                        
                                    ]}
                                    onPress={() => {
                                        if (!currentlyInteracting) {
                                            handleTilePress(tile.row, tile.col);
                                        } else if (currentlyInteracting) {
                                            handleInteractionPress(tile.row, tile.col);
                                        } else {
                                            setAvailableInteractions([]);
                                        }
                                    }}
                                >
                                    {occupied?.toLocaleLowerCase() === "guard" ? (
                                        <View
                                            style={[
                                                styles.guard,
                                                getGuardVisuals(tile.row, tile.col, false) === 'neutral' &&
                                                    styles.guardNeutral,
                                                getGuardVisuals(tile.row, tile.col, false) === 'suspicion' &&
                                                    styles.guardSuspicious,
                                                getGuardVisuals(tile.row, tile.col, false) === 'alert' &&
                                                    styles.guardAlert
                                            ]}
                                        >
                                            <Text style={styles.guardText}>
                                                {getGuardVisuals(tile.row, tile.col, true)}
                                            </Text>
                                        </View>
                                    ) : occupied?.toLowerCase() === "cam" || occupied?.toLowerCase() === "!cam!" || occupied?.toLowerCase() === "iac" ? (
                                        <View>
                                            <Text style={[occupied?.toLowerCase() === "iac" ? styles.camTextOff : styles.camText]}>
                                                {occupied}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View>
                                            <Text
                                                style={{
                                                    color:
                                                        occupied === "↻" || occupied === "↺"
                                                            ? powerOut
                                                                ? "white"
                                                                : "black"
                                                            : powerOut
                                                                ? "white"
                                                                : "#2b1b12",
                                                    fontWeight: "bold",
                                                    fontSize: 
                                                        occupied === "↻" || occupied === "↺"
                                                        ? 25 
                                                        : 13,
                                                    backgroundColor: (occupied?.length ?? 0) > 1 && occupied?.charAt(0) !== "D" ? "gold" : "transparent",
                                                }}
                                            >
                                                {occupied}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.player,
                        {
                            transform: [
                                { translateX: playerX },
                                { translateY: playerY },
                            ],
                        },
                    ]}
                >
                    <Text style={{ fontWeight: "bold", backgroundColor: "white", color: "black",}}>YOU</Text>
                </Animated.View>
            </View>
            <Pressable style={styles.toolBelt} onPress={() => {showAvailableInteractions()}}>
                {Array.from({ length: toolBeltLength }).map((_, index) => {
                    const item = toolBeltItems[index];

                    return (
                        <View style={[styles.toolBeltItem, getCurrentState() === "Interacting" && styles.wallTile]} key={index}>
                            {item ? (
                                <View>
                                    <Text>{item.name} X {item.quantity}</Text>
                                </View>
                            ) : (
                                <Text>Empty</Text>
                            )}
                        </View>
                    );
                })}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    player: {
        position: "absolute",
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#afafaf",
    },

    grid: {
        width: "90%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#242424",
    },

    row: {
        flexDirection: "row",
        flex: 1,
    },

    tile: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#555",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#303030",
    },

    controls: {
        flexDirection: "column",
    },

    controlButton: {
        padding: 10,
        margin: 5,
        backgroundColor: "#ccc",
        borderRadius: 5,
        alignItems: "center",
    },

    controlButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },

    // PLAYER MOVEMENT 

    availableTile: {
        backgroundColor: "#3d78b8",
        opacity: 0.75,
    },

    // DOORS 

    doorTileOpen: {
        backgroundColor: "#4f9d69",
    },

    doorTileClosed: {
        backgroundColor: "#a84c4c",
    },

    // WIN 

    winTile: {
        backgroundColor: "#a65b9f",
    },

    // POWER 

    powerOutTile: {
        backgroundColor: "#444242",
        borderColor: "#555",
    },

    powerOnTile: {
        backgroundColor: "#8a5126",
        borderColor: "#222",
    },

    gridPowerSwitchTile: {
        backgroundColor: "#d18a32",
    },

    // VISION 

    guardVision: {
        backgroundColor: "#fcc80f",
        opacity: 0.6,
    },

    alertVision: {
        backgroundColor: "#c94b4b",
        opacity: 0.45,
    },

    cameraVision: {
        backgroundColor: "#026a1d",
        opacity: 0.9,
    },

    alertCameraVision: {
        backgroundColor: "#c94b4b",
        opacity: 0.45,
    },


    interactionTile: {
        backgroundColor: "#7653a6",
        opacity: 0.65,
    },

    // WALLS 

    wallTile: {
        backgroundColor: "#7653a6",
    },

    northWall: {
        borderTopWidth: 3,
        borderTopColor: "#111",
    },

    northBrittleWall: {
        borderTopWidth: 3,
        borderTopColor: "#c94b4b",
    },

    northPowerWall: {
        borderTopWidth: 3,
        borderTopColor: "#d18a32",
    },

    southWall: {
        borderBottomWidth: 3,
        borderBottomColor: "#111",
    },

    southBrittleWall: {
        borderBottomWidth: 3,
        borderBottomColor: "#c94b4b",
    },

    southPowerWall: {
        borderBottomWidth: 3,
        borderBottomColor: "#d18a32",
    },

    eastWall: {
        borderRightWidth: 3,
        borderRightColor: "#111",
    },

    eastBrittleWall: {
        borderRightWidth: 3,
        borderRightColor: "#c94b4b",
    },

    eastPowerWall: {
        borderRightWidth: 3,
        borderRightColor: "#d18a32",
    },

    westWall: {
        borderLeftWidth: 3,
        borderLeftColor: "#111",
    },

    westBrittleWall: {
        borderLeftWidth: 3,
        borderLeftColor: "#c94b4b",
    },

    westPowerWall: {
        borderLeftWidth: 3,
        borderLeftColor: "#d18a32",
    },

    // GUARDS 

    guard: {
        width: "82%",
        height: "82%",
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },

    guardNeutral: {
        backgroundColor: "#777",
        borderWidth: 1,
        borderColor: "#aaa",
    },

    guardSuspicious: {
        backgroundColor: "#c47b32",
        borderWidth: 1,
        borderColor: "#e0a05a",
    },

    guardAlert: {
        backgroundColor: "#b84444",
        borderWidth: 1,
        borderColor: "#e47777",
    },

    guardText: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#fff",
        opacity: 0.8,
    },
    // CAMERAS

    camText: {
        fontWeight: "bold",
        color: "#fff",
        opacity: 0.8,
        backgroundColor: "#01ad77",
        padding: 3,
        borderRadius: 4,
    },

    camTextOff: {
        fontWeight: "bold",
        color: "#fff",
        opacity: 0.8,
        backgroundColor: "#d66464",
        padding: 3,
        borderRadius: 4,
    },

    // TOOLBELT 

    toolBelt: {
        flexDirection: "row",
        paddingTop: 10,
    },

    toolBeltItem: {
        padding: 10,
        borderWidth: 1,
        borderColor: "#666",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default Game;