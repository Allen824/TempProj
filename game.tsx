import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { createGrid } from "./grid";
import { useRouter } from 'expo-router';

const Game = () => {
    const router = useRouter();
    const [grid, setGrid] = useState(() => createGrid());
    const [playerStartingPosition, setPlayerStartingPosition] = useState({ row: 0, col: 4 });
    const [getPlayerAt, setGetPlayerAt] = useState([{ row: playerStartingPosition.row, col: playerStartingPosition.col }]);
    const [toolBeltLength, setToolBeltLength] = useState(3)
    const [toolBeltItems, setToolBeltItems] = useState<{ name: string; quantity: number }[]>([
    ]);
    const [availableMoves, setAvailableMoves] = useState<{ row: number; col: number }[]>([]);
    const [currentlyMoving, setCurrentlyMoving] = useState(false)
    const [moveLength, setMoveLength] = useState(1)
    const [winTile, setWinTile] = useState({ row: 0, col:   0 })
    const [doorData, setDoorData] = useState([{ row: 2, col: 2, isOpen: false }])
    const [wallData, setWallData] = useState([
        // Level Divider
        { walls: ["east"], brittle: [],row: 0, col: 2}, 
        { walls: ["east"], brittle: [], row: 1, col: 2 }, 
        { walls: ["east"], brittle: [], row: 3, col: 2}, 
        { walls: ["east"], brittle: [], row: 4, col: 2}, 
        { walls: ["east"], brittle: [], row: 5, col: 2}, 
        { walls: ["east"], brittle: [{direction: "east", health: 3}], row: 6, col: 2},
        // Starter Room
        { walls: ["south"], brittle: [],row: 1, col: 4},
        { walls: ["south", "east"], brittle: [], row: 1, col: 5},
        //Key Room
        { walls: ["north"], brittle: [], row: 6, col: 5},
        { walls: ["north"], brittle: [], row: 6, col: 6}
    ]) 
    const [guardData, setGuardData] = useState([
        { id: 1, type: "grunt", state: "patrol", row: 2, col: 0, 
            pattern: "fourway", direction: "north", status: "fine", statusLength: 0, stateLength: 0, suspicionRow: null as number | null,
            suspicionCol: null as number | null,},
        //{ id: 2, type: "officer", state: "patrol", row: 4, col: 5, pattern: "wander", direction: "north", status: "fine", statusLength: 0}
    ])
    const [itemData, setItemData] = useState([{ type: 'key', row: 6, col: 6, isCollected: false }, 
    { type: 'blind', row: 0, col: 5, isCollected: false},
    { type: 'key', row: 0, col: 3, isCollected: false}])
    const [availableInteractions, setAvailableInteractions] = useState<
    { row: number; col: number; type: string }[]
>([]);
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


    const handleWin = () => {
        console.log("You win!");
        router.replace('/win');
    }

    const handleCapture = () => {
        console.log("You are in capture range")
        router.replace('/lose');
    }
    const getOccupied = (row: number, col: number) => {
        const item = getItemData(row, col)
        if (getPlayerAt.some((player) => player.row === row && player.col === col)) {
            return "YOU"
        }

        if(getGuardData(row, col)) {
            return "GUARD"
        }

        if (item && !item.isCollected) {
            return item.type.toUpperCase();
        }
    }
    const getWinTile = (row: number, col: number) => {
        return winTile.row === row && winTile.col === col;
    }
    const getDoorData = (row: number, col: number) => {
        return doorData.find((door) => door.row === row && door.col === col);
    }

    const getWallData = (row: number, col: number) => {
        return wallData.find((wall) => wall.row === row && wall.col === col);
    }

    const getGuardData = (row: number, col: number) => {
        return guardData.find((guard) => guard.row === row && guard.col === col);
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
                        handleCapture();
                    }

                    return {
                        ...guard,
                        row: newRow,
                        col: newCol,
                    }
                }
                else if (guard.state === "suspicion") {
                    console.log('here')
                    console.log(guard.suspicionRow + " " + guard.suspicionCol)
                    if (guard.suspicionRow === null || guard.suspicionCol === null) {
                        return guard;
                    }
                    console.log(guard.suspicionRow + " " + guard.suspicionCol)
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
                                ? "patrol"
                                : guard.state,
                        suspicionRow: spottedPlayer || reachedSuspicionLocation
                            ? null
                            : guard.suspicionRow,
                        suspicionCol: spottedPlayer || reachedSuspicionLocation
                            ? null
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
                    direction: newDirection,
                    state: spottedPlayer ? "suspicion" : guard.state,
                    statusLength: guard.status === "Blind"
                        ? guard.statusLength - 1
                        : guard.statusLength,
                    status: guard.status === "Blind" && guard.statusLength - 1 <= 0
                        ? "fine"
                        : guard.status,
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
                    suspicionRow: spottedPlayer ? row : guard.suspicionRow,
                    suspicionCol: spottedPlayer ? col : guard.suspicionCol,
                    
                };
            }
            else if (guard.pattern === "vertical") {
                return {
                    ...guard,
                    direction: guard.direction ==="north" ? "south" : "north",
                    statusLength: guard.status === "Blind"
                        ? guard.statusLength - 1
                        : guard.statusLength,
                    status: guard.status === "Blind" && guard.statusLength - 1 <= 0
                        ? "fine"
                        : guard.status
                };
            }

                return guard;
            })
        );
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
                currentWall?.walls.includes("north") ||
                destinationWall?.walls.includes("south")
            ) {
                return false;
            }
        }

        if (toRow > fromRow) {
            if (
                currentWall?.walls.includes("south") ||
                destinationWall?.walls.includes("north")
            ) {
                return false;
            }
        }

        if (toCol > fromCol) {
            if (
                currentWall?.walls.includes("east") ||
                destinationWall?.walls.includes("west")
            ) {
                return false;
            }
        }

        if (toCol < fromCol) {
            if (
                currentWall?.walls.includes("west") ||
                destinationWall?.walls.includes("east")
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
                advanceGuards(row, col)
                break;
            case "blind":

                const blind = toolBeltItems.find(item => item.name === "blind")

                if(!blind || blind.quantity <= 0) return

                setGuardData(prev => 
                    prev.map(guard => 
                        guard.row === row && guard.col === col 
                            ? {...guard, status: "Blind", statusLength: 2}
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
                advanceGuards(row, col);
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

    const handleTilePress = (row: number, col: number) => {
        if (currentlyMoving && isAvailableMove(row, col)) {
            setGetPlayerAt([{ row, col }]);
            setAvailableMoves([]);
            setCurrentlyMoving(false);

            setAvailableInteractions([]);
            setCurrentlyInteracting(false);

            advanceGuards(row, col);

            const item = getItemData(row, col)
            if (item && !item.isCollected) {
                setToolBeltItems(prev => {
                    const existingItem = prev.find(
                        toolItem => toolItem.name === item.type
                    );

                    if (existingItem) {
                        return prev.map(toolItem =>
                            toolItem.name === item.type
                                ? { ...toolItem, quantity: toolItem.quantity + 1 }
                                : toolItem
                        );
                    } else {
                        return [
                            ...prev,
                            { name: item.type, quantity: 1 }
                        ];
                    }
                });

                setItemData(prev =>
                    prev.map(currentItem =>
                        currentItem.row === row &&
                        currentItem.col === col
                            ? { ...currentItem, isCollected: true }
                            : currentItem
                    )
                );
            }
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
                    ) : currentlyMoving ? (
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
                            <Pressable
                                style={styles.controlButton}
                                onPress={() => showAvailableMoves()}
                            >
                                <Text>Action</Text>
                            </Pressable>
                        </>
                    )}
            </View>
            <View style={styles.grid}>
            {grid.map((row) => (
                <View key={row[0].row} style={styles.row}>
                    {row.map((tile) => (
                        <Pressable
                            key={tile.id}
                            style={[
                                styles.tile,

                                getNorthWallStyle(tile.row, tile.col),
                                getSouthWallStyle(tile.row, tile.col),
                                getEastWallStyle(tile.row, tile.col),
                                getWestWallStyle(tile.row, tile.col),

                                isGuardVision(tile.row, tile.col) === "yellow" && styles.guardVision,
                                isGuardVision(tile.row, tile.col) === "red" && styles.alertVision,

                                isAvailableMove(tile.row, tile.col) && styles.availableTile,
                                getVisuals(tile.row, tile.col) === "Opendoor" && styles.doorTileOpen,
                                getVisuals(tile.row, tile.col) === "Closeddoor" && styles.doorTileClosed,
                                getVisuals(tile.row, tile.col) === "WinTile" && styles.winTile,
                                isAvailableInteraction(tile.row, tile.col) && styles.interactionTile,
                            ]}
                            onPress={() => {
                                if (currentlyMoving) {
                                    handleTilePress(tile.row, tile.col);
                                } else if (currentlyInteracting) {
                                    handleInteractionPress(tile.row, tile.col);
                                } else {
                                    setAvailableInteractions([]);
                                }
                            }}
                        >
                            {getOccupied(tile.row, tile.col)?.toLocaleLowerCase() === "guard" ? (
                                <View style={[styles.guard, 
                                getGuardVisuals(tile.row, tile.col, false) === 'neutral' && styles.guardNeutral,
                                getGuardVisuals(tile.row, tile.col, false) === 'suspicion' && styles.guardSuspicious,
                                getGuardVisuals(tile.row, tile.col, false) === 'alert' && styles.guardAlert
                                ]}>
                                    <Text style={styles.guardText}>{getGuardVisuals(tile.row, tile.col, true)}</Text>
                                </View>
                            ) : (
                                <View>
                                    <Text>{getOccupied(tile.row, tile.col)}</Text>
                                </View>
                            )}
                        </Pressable>
                    ))}
                </View>
            ))}
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
    container: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center", 
    },
    grid: {
        width: "90%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    row: {
        flexDirection: "row",
        flex: 1
    },

    tile: {
        flex: 1,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
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
    availableTile: {
        backgroundColor: "#0062ff",
    },
    doorTileOpen: {
        backgroundColor: "#00ff00",
    },
    doorTileClosed: {
        backgroundColor: "#ff0000",
    },
    wallTile: {
        backgroundColor: "#ff15ff",
    },
    winTile: {
        backgroundColor: "#be7106",
    },
    guardVision: {
        backgroundColor: "yellow",
        opacity: 0.4
    },
    alertVision: {
        backgroundColor: "red",
        opacity: 0.4
    },
    interactionTile: {
        backgroundColor: "purple",
    },
    northWall: {
        borderTopWidth: 4,
        borderTopColor: "black",
    },

    northBrittleWall: {
        borderTopWidth: 4,
        borderTopColor: "red"
    },

    southWall: {
        borderBottomWidth: 4,
        borderBottomColor: "black",
    },

    southBrittleWall: {
        borderBottomWidth: 4,
        borderBottomColor: "red"
    },

    eastWall: {
        borderRightWidth: 4,
        borderRightColor: "black",
    },

    eastBrittleWall: {
        borderRightWidth: 4,
        borderRightColor: "red",
    },

    westWall: {
        borderLeftWidth: 4,
        borderLeftColor: "black",
    }, 

    westBrittleWall: {
        borderLeftWidth: 4,
        borderLeftColor: "red"
    },

    toolBelt: {
        flexDirection: "row",
        paddingTop: 10
    },
    toolBeltItem: {
        padding: 10,
        borderWidth: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    guard: {
        width: "90%",
        height: "90%",
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
    },

    guardNeutral: {
        backgroundColor: 'grey'
    },

    guardSuspicious: {
        backgroundColor: 'orange'
    },

    guardAlert: {
        backgroundColor: 'red'
    },

    guardText: {
        fontSize: 30,
        fontWeight: "bold",
        color: 'white',
        opacity: 0.7
    },
});

export default Game;