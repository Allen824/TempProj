import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Button } from "react-native";
import { createGrid } from "./grid";
import { useRouter } from 'expo-router';
import { Image } from "react-native";

const Game = () => {
    const router = useRouter();
    const [grid, setGrid] = useState(() => createGrid());
    const [gridSize, setGridSize] = useState(0);
    const tileSize = gridSize / 6;
    const [playerStartingPosition, setPlayerStartingPosition] = useState({ row: 0, col: 4 });
    const [getPlayerAt, setGetPlayerAt] = useState([{ row: playerStartingPosition.row, col: playerStartingPosition.col }]);
    const playerX = useRef(new Animated.Value(0)).current;
    const playerY = useRef(new Animated.Value(0)).current;
    const [steps, setSteps] = useState(0)
    const [score, setScore] = useState(0)
    const [targetScore, setTargetScore] = useState(500);
    const [turn, setTurn] = useState(1);
    const multipliers = [
        { number: -1, multiplier: 1 },
        { number: 1, multiplier: 1.2 },
        { number: 2, multiplier: 1.4 },
        { number: 3, multiplier: 1.6 },
        { number: 4, multiplier: 1.8 },
        { number: 5, multiplier: 2 },
        { number: 6, multiplier: 2.5 },
    ];

    const chanceHit = [
        { number: -1, chance: 1 },
        { number: 1, chance: 0.95 },
        { number: 2, chance: 0.8 },
        { number: 3, chance: 0.7 },
        { number: 4, chance: 0.6 },
        { number: 5, chance: 0.5 },
        { number: 6, chance: 0.4 },
    ];

    const tripleEvents = [
        { Text: "Double Down: Your next evidence extraction will give double the score.", id: 1},
        { Text: "Refesh: Depleted squares will be refereshed with this number", id: 2},
        { Text: "Escape: Leave the level.", id: 3}
    ]

    const gameEvents = [
        { Text: "Security Sweep", turns: 3, firstNumber: 3, secondNumber: 2, thirdNumber: 5},      
        { Text: "Power Outage", turns: 3, firstNumber: 4, secondNumber: 6, thirdNumber: 3},
        { Text: "Board Refresh" , turns: 3, firstNumber: 1, secondNumber: 2, thirdNumber: -1},
    ]

    type EventData = {
        Text: string;
        turns: number;
        firstNumber: number;
        secondNumber: number;
        thirdNumber: number;
    };

    const [currentEvent, setCurrentEvent] = useState<EventData>()

    const [dice, setDice] = useState({ diceOne: 0, diceTwo: 0 });
    const [detection, setDetection] = useState(0);
    type Evidence = {
        id: number;
        type: string;
        row: number;
        col: number;
        isCollected: boolean;
    };
    const [evidence, setEvidence] = useState<Evidence[]>([
        //{ id: 1, type: "Photograph", row: 5, col: 3, isCollected: false },
    ])

    const [playerCaptured, setPlayerCaptured] = useState(false);
    const [toolBeltLength, setToolBeltLength] = useState(3)
    const [toolBeltItems, setToolBeltItems] = useState<{ name: string; quantity: number }[]>([
    ]);
    const [availableMoves, setAvailableMoves] = useState<{ row: number; col: number }[]>([]);
    const [currentlyMoving, setCurrentlyMoving] = useState(false)
    const [moveLength, setMoveLength] = useState(1)
    const [powerOut, setPowerOut] = useState(false)
    type Door = {
        id: number;
        row: number;
        col: number;
        isOpen: boolean;
        powered: boolean;
        direction: "north" | "south" | "east" | "west";
    };

    const [doorData, setDoorData] = useState<Door[]>([]);

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
    const [wallData, setWallData] = useState<Wall[]>([]
        // { walls: ["east", "south"], brittle: [], powered: [{direction: "east", source: "grid"}], row: 0, col: 2}, 
    ) 
    type Guard = {
        type: string;
        state: string;
        row: number;
        col: number;
        pattern: string;
        direction: string;
        status: string;
        statusLength: number;
        stateLength: number;
        suspicionRow: number | null;
        suspicionCol: number | null;
    }
    const [guardData, setGuardData] = useState<Guard[]>([
        /*{ id: 1, type: "grunt", state: "patrol", row: 2, col: 0, 
            pattern: "fourway", direction: "north", status: "fine", statusLength: 0, stateLength: 0, suspicionRow: null as number | null,
            suspicionCol: null as number | null,},*/

    ])
    type Camera = {
        id: number;
        row: number;
        col: number;
        direction: string;
        state: string;
        type: string;
        controlsDoor: number;
    }
    const [cameraData, setCameraData] = useState<Camera[]>([
        /*{
            id: 1,
            row: 4,
            col: 3,
            direction: "north",
            state: "active",
            type: "door",
            controlsDoor: 1
        }*/
    ]);
    const [cameraDistance, setCameraDistance] = useState([
        {type: "door" , distance: 3}
    ]);

    type Item = {
        type: string;
        row: number;
        col: number;
        isCollected: boolean;
    }

    const [itemData, setItemData] = useState<Item[]>([
        /*
        { type: 'blind', row: 1, col: 5, isCollected: false},
        { type: 'key', row: 5, col: 5, isCollected: false},
         */
    ])

    type PowerSquare = {
        type: string;
        row: number;
        col: number;
    }
    const [powerSquareData, setPowerSquareData] = useState<PowerSquare[]>([
        /*
        {type: 'grid', row: 4, col: 5},
        {type: 'grid', row: 5, col: 0}])
        */
    ]);
    const [availableInteractions, setAvailableInteractions] = useState<
    { row: number; col: number; type: string }[]>([]);
    const [currentlyInteracting, setCurrentlyInteracting] = useState(false);

    useEffect(() => {
        if (detection >= 100) {
            setPlayerCaptured(true);
        }
    }, [detection]);


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
        router.replace('/win');
    }

    const handleCapture = () => {
        router.replace('/lose');
    }

    const handleDiceRoll = (whichDice: string) => {
        if (whichDice === "both") {
            setDice({
                diceOne: Math.floor(Math.random() * 6) + 1,
                diceTwo: Math.floor(Math.random() * 6) + 1,
            })
        }
        else if (whichDice === "diceOne") {
            setDice({
                ...dice,
                diceOne: Math.floor(Math.random() * 6) + 1,
            });
        }
        else if (whichDice === "diceTwo") {
            setDice({
                ...dice,
                diceTwo: Math.floor(Math.random() * 6) + 1,
            });
        }
    }

    const handleEvent = () => {
        console.log("Handling event for turn: " + turn);
        if(turn === 1) {
            setCurrentEvent(gameEvents[0])
        }
        const playerNumber = grid[getPlayerAt[0].row][getPlayerAt[0].col].number;
        const diceNumbers = [dice.diceOne, dice.diceTwo, playerNumber];

        setCurrentEvent(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                firstNumber: diceNumbers.includes(prev.firstNumber) ? 10 : prev.firstNumber,
                secondNumber: diceNumbers.includes(prev.secondNumber) ? 10 : prev.secondNumber,
                thirdNumber: diceNumbers.includes(prev.thirdNumber) ? 10 : prev.thirdNumber,
            };
        });
        
    }

    const updateScore = () => {    
        const tileNumber = grid[getPlayerAt[0].row][getPlayerAt[0].col].numberUsed ? -1 : grid[getPlayerAt[0].row][getPlayerAt[0].col].number;
        const total = dice.diceOne + dice.diceTwo + tileNumber;
        const lowestNumber = Math.min(dice.diceOne, dice.diceTwo, tileNumber)
        const mult = multipliers.find((m) => m.number === lowestNumber)?.multiplier || 1;
        const risk = chanceHit.find((c) => c.number === lowestNumber)?.chance || 0;
        const randomNumber = Math.random();
        console.log("Lowest number: " + lowestNumber + " 3 num: " + dice.diceOne + ", " + dice.diceTwo + ", " + tileNumber)
        console.log("Previous score: " + score)
        console.log("Total: " + total + ", Multiplier: " + mult + " Final added: " + (total * mult));
        if(randomNumber <= risk) {    
            console.log("Your chance of " + risk * 100 + "% hit! (" + randomNumber + ")");    
            setScore((prevScore) => Math.round((prevScore + total * mult) * 100) / 100);
            grid[getPlayerAt[0].row][getPlayerAt[0].col].numberUsed = true;
        }
        else {
            console.log(
                "Your chance of " + risk * 100 + "% failed to hit (" + randomNumber + ")"
            );

            const reducedScore = total * mult * 0.25;

            setScore((prevScore) =>
                Math.round((prevScore + reducedScore) * 100) / 100
            );

            grid[getPlayerAt[0].row][getPlayerAt[0].col].numberUsed = true;
        }
        setTurn((prevTurn) => prevTurn + 1);
        handleEvent()
        console.log("***************************")
    }
    const getOccupied = (row: number, col: number) => {
        const item = getItemData(row, col);
        const evidenceItem = getEvidenceData(row, col);

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

        if (evidenceItem && !evidenceItem.isCollected) {
            return evidenceItem.type.toUpperCase();
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

    const getItemImage = (row: number, col: number) => {
        const item = getItemData(row, col);

        if (!item || item.isCollected || powerOut) {
            return null;
        }

        switch (item.type) {
            case "key":
                return require("../assets/keyItem.png");

            case "blind":
                return require("../assets/blindItem.png");

            default:
                return null;
        }
    };

    const getEvidenceImage = (row: number, col: number) => {
        const evidenceItem = getEvidenceData(row, col);

        if (!evidenceItem || evidenceItem.isCollected) {
            return null;
        }

        switch (evidenceItem.type) {
            case "Photograph":
                return require("../assets/photoEvidence.png"); 
            
            default:
                return null
        }
    }

    const getItemData = (row: number, col: number) => {
        return itemData.find(
            item => item.row === row && item.col === col
        );
    };

    const getEvidenceData = (row: number, col: number) => {
        return evidence.find(
            evidence => evidence.row === row && evidence.col === col
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

    const isDoorClosed = (
        row: number,
        col: number,
        direction: "north" | "south" | "east" | "west"
    ) => {
        const door = doorData.find(
            door =>
                door.row === row &&
                door.col === col &&
                door.direction === direction
        );

        return door ? !door.isOpen : false;
    };

    const isDoorInRange = (
        door: {
            row: number;
            col: number;
            direction: string;
        },
        playerRow: number,
        playerCol: number
    ) => {
        if (door.row === playerRow && door.col === playerCol) {
            return true;
        }

        if (door.direction === "north") {
            return (
                playerRow === door.row - 1 &&
                playerCol === door.col
            );
        }

        if (door.direction === "south") {
            return (
                playerRow === door.row + 1 &&
                playerCol === door.col
            );
        }

        if (door.direction === "east") {
            return (
                playerRow === door.row &&
                playerCol === door.col + 1
            );
        }

        if (door.direction === "west") {
            return (
                playerRow === door.row &&
                playerCol === door.col - 1
            );
        }

        return false;
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
                    if(guard.stateLength <= 0) {
                        setDetection(prevDetection => Math.max(prevDetection - 10, 0));
                    }
                    const newStateLength = guard.stateLength - 1;

                    return {
                        ...guard,
                        row: newRow,
                        col: newCol,
                        stateLength: Math.max(newStateLength, 0),
                        state: newStateLength > 0 ? "alert" : "patrol",
                    };
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
                        const spottedPlayer = canSuspicionGuardSeePlayer(
                            guard,
                            row,
                            col
                        );

                        if (spottedPlayer) {
                            return {
                                ...guard,
                                state: "alert",
                                stateLength: 7,
                                suspicionRow: null,
                                suspicionCol: null
                            };
                        }

                        if (guard.stateLength > 0) {
                            return {
                                ...guard,
                                stateLength: guard.stateLength - 1
                            };
                        }

                        setDetection(prevDetection => Math.max(prevDetection - 10, 0));

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

                    if(spottedPlayer) {
                        setDetection(prevDetection => Math.min(prevDetection + 10, 100));
                    }

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

                        stateLength: spottedPlayer
                            ? 7
                            : reachedSuspicionLocation
                                ? 1
                                : guard.stateLength,

                        suspicionRow: spottedPlayer
                            ? null
                            : guard.suspicionRow,

                        suspicionCol: spottedPlayer
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

                if(spottedPlayer) {
                    setDetection(prevDetection => Math.min(prevDetection + 10, 100));
                }

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

    const getVisionDirection = (
        row: number,
        col: number
    ) => {
        const guard = guardData.find(
            guard => guard.row === row && guard.col === col
        );

        if (!guard || guard.status === "Blind") {
            return null;
        }

        return guard.direction;
    };

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

            if (row === camera.row && col === camera.col) {
                return camera.state === "alert"
                    ? "red"
                    : "source";
            }

            if (camera.controlsDoor !== undefined) {
                const door = doorData.find(
                    door => door.id === camera.controlsDoor
                );

                if (door && door.row === row && door.col === col) {
                    return door.isOpen
                        ? "source"
                        : "red";
                }
            }

            const maxDistance =
                cameraDistance.find(
                    d => d.type === camera.type
                )?.distance || 0;

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
        if(getGuardData(row, col)) {
            return false;
        }
        return true
    }

    const canMove = (
        fromRow: number,
        fromCol: number,
        toRow: number,
        toCol: number
    ) => {

        if (
            Math.abs(fromRow - toRow) +
            Math.abs(fromCol - toCol) !== 1
        ) {
            return false;
        }

        const currentWall = getWallData(fromRow, fromCol);
        const destinationWall = getWallData(toRow, toCol);

        if (toRow < fromRow) {
            if (
                isWallActive(currentWall, "north") ||
                isWallActive(destinationWall, "south") ||
                isDoorClosed(fromRow, fromCol, "north") ||
                isDoorClosed(toRow, toCol, "south")
            ) {
                return false;
            }
        }

        if (toRow > fromRow) {
            if (
                isWallActive(currentWall, "south") ||
                isWallActive(destinationWall, "north") ||
                isDoorClosed(fromRow, fromCol, "south") ||
                isDoorClosed(toRow, toCol, "north")
            ) {
                return false;
            }
        }

        if (toCol > fromCol) {
            if (
                isWallActive(currentWall, "east") ||
                isWallActive(destinationWall, "west") ||
                isDoorClosed(fromRow, fromCol, "east") ||
                isDoorClosed(toRow, toCol, "west")
            ) {
                return false;
            }
        }

        if (toCol < fromCol) {
            if (
                isWallActive(currentWall, "west") ||
                isWallActive(destinationWall, "east") ||
                isDoorClosed(fromRow, fromCol, "west") ||
                isDoorClosed(toRow, toCol, "east")
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

        if (getItemExist("key")) {
            const doorInteractions = doorData
                .filter(
                    door =>
                        !door.isOpen &&
                        !door.powered &&
                        isDoorInRange(
                            door,
                            player.row,
                            player.col
                        )
                )
                .map(door => ({
                    row: door.row,
                    col: door.col,
                    type: "door"
                }));

            tempInteractions.push(...doorInteractions);
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
        updateScore()
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

            const evidenceItem = getEvidenceData(row, col);

            if (evidenceItem && !evidenceItem.isCollected) {
                setEvidence(prev =>
                    prev.map(currentEvidence =>
                        currentEvidence.row === row &&
                        currentEvidence.col === col
                            ? { ...currentEvidence, isCollected: true }
                            : currentEvidence
                    )
                );
            }

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

            if (camera && camera.state !== "inactive") {
                setCameraData(prev =>
                    prev.map(currentCamera =>
                        currentCamera.id === camera.id
                            ? { ...currentCamera, state: "inactive" }
                            : currentCamera
                    )
                );

                if (camera.controlsDoor !== undefined) {
                    setDoorData(prevDoors =>
                        prevDoors.map(door =>
                            door.id === camera.controlsDoor
                                ? { ...door, isOpen: true }
                                : door
                        )
                    );
                }
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
            setSteps(prevSteps => prevSteps + 1);
        }
    };


    const cancelMove = () => {
        setAvailableMoves([]);
        setCurrentlyMoving(false);

        setAvailableInteractions([]);
        setCurrentlyInteracting(false);
    };

    const getTileImage = (
        row: number, 
        col: number) => {
        const door = getDoorData(row, col);

        if (getPowerGridData(row, col)) {
            return require("../assets/powerTile.png");
        }
        if(powerOut) {
            return require("../assets/woodFloorPowerOut2.png");
        }
        return require("../assets/woodFloor1.png");
        
    };

    const getDoorImage = (
        row: number,
        col: number,
        direction: "north" | "south" | "east" | "west"
    ) => {
        const door = doorData.find(
            door =>
                door.row === row &&
                door.col === col &&
                door.direction === direction
        );

        if (!door) {
            return null;
        }

        if (door.powered) {
            if (door.isOpen) {
                return {
                    north: require("../assets/openPowerDoorNorth.png"),
                    south: require("../assets/openPowerDoorSouth.png"),
                    east: require("../assets/openPowerDoorEast.png"),
                    west: require("../assets/openPowerDoorWest.png"),
                }[direction];
            }

            return {
                north: require("../assets/closedPowerDoorNorth.png"),
                south: require("../assets/closedPowerDoorSouth.png"),
                east: require("../assets/closedPowerDoorEast.png"),
                west: require("../assets/closedPowerDoorWest.png"),
            }[direction];
        }

        if (door.isOpen) {
            return null
        }

        return {
            north: require("../assets/closedDoorNorth.png"),
            south: require("../assets/closedDoorSouth.png"),
            east: require("../assets/closedDoorEast.png"),
            west: require("../assets/closedDoorWest.png"),
        }[direction];
    };

    const getWallImage = (
        row: number,
        col: number,
        direction: "north" | "south" | "east" | "west"
    ) => {
        const wall = getWallData(row, col);

        if (!wall?.walls.includes(direction)) {
            return null;
        }

        if (wall.brittle.some(b => b.direction === direction)) {
            return {
                north: require("../assets/northBrittleWall.png"),
                south: require("../assets/southBrittleWall.png"),
                east: require("../assets/eastBrittleWall.png"),
                west: require("../assets/westBrittleWall.png"),
            }[direction];
        }


        if (wall.powered?.some(p => p.direction === direction)) {
            if (isWallActive(wall, direction)) {
                return {
                    north: require("../assets/northPowerWall.png"),
                    south: require("../assets/southPowerWall.png"),
                    east: require("../assets/eastPowerWall.png"),
                    west: require("../assets/westPowerWall.png"),
                }[direction];
            }


            return null;
        }

        return {
            north: require("../assets/northWall.png"),
            south: require("../assets/southWall.png"),
            east: require("../assets/eastWall.png"),
            west: require("../assets/westWall.png"),
        }[direction];
    };

    return (
        <View style={styles.container}>
            <View style={styles.controls}>
                <View style={styles.stats}>
                    <Text style={styles.controlText}>Steps: {steps}</Text>
                    <Text style={styles.controlText}>Detection: {detection}%</Text>
                    <Text style={styles.controlText}>
                        Evidence: {evidence.filter(e => e.isCollected).length}/{evidence.length}
                    </Text> 
                    <Text style={styles.controlText}>Tile: {grid[getPlayerAt[0].row][getPlayerAt[0].col].number}</Text>
                    <Text style={styles.controlText}>Score: {score}</Text>
                </View>
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
                                    style={styles.tile}                                    
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
                            
                                    <Image
                                        source={getTileImage(tile.row, tile.col)}
                                        style={{
                                            width: tileSize,
                                            height: tileSize,
                                            position: "absolute"
                                        }}
                                        resizeMode="stretch"
                                    />

                                    {(["north", "south", "east", "west"] as const).map((direction) => {
                                        const wallImage = getWallImage(tile.row, tile.col, direction);

                                        if (!wallImage) return null;

                                        return (
                                            <Image
                                                key={direction}
                                                source={wallImage}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    position: 'absolute',
                                                }}
                                                resizeMode="contain"
                                            />
                                        );
                                    })}

                                    {(["north", "south", "east", "west"] as const).map((direction) => {
                                        const doorImage = getDoorImage(tile.row, tile.col, direction);

                                        if (!doorImage) return null;

                                        return (
                                            <Image
                                                key={direction}
                                                source={doorImage}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    position: "absolute",
                                                }}
                                                resizeMode="contain"
                                            />
                                        );
                                    })}

                                    {getItemImage(tile.row, tile.col) && (
                                        <Image
                                            source={getItemImage(tile.row, tile.col)!}
                                            style={styles.itemImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                    {getEvidenceImage(tile.row, tile.col) && (
                                        <Image
                                            source={getEvidenceImage(tile.row, tile.col)!}
                                            style={styles.itemImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                    {cameraData.some(
                                        camera => camera.row === tile.row && camera.col === tile.col
                                    ) && (
                                        <Image
                                            source={require("../assets/camera.png")}
                                            style={styles.cameraImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                    {guardData.some(
                                        guard => guard.row === tile.row && guard.col === tile.col
                                    ) && (
                                        <Image
                                            source={require("../assets/standardGuard.png")}
                                            style={styles.guardImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                    {isGuardVision(tile.row, tile.col) === "yellow" && (
                                        <View
                                            pointerEvents="none"
                                            style={styles.guardVision}
                                        />
                                    )}

                                    {isGuardVision(tile.row, tile.col) === "red" && (
                                        <View
                                            pointerEvents="none"
                                            style={styles.alertVision}
                                        />
                                    )}

                                    {isCameraVision(tile.row, tile.col) === "yellow" && (
                                        <View
                                            pointerEvents="none"
                                            style={styles.cameraVision}
                                        />
                                    )}

                                    {isCameraVision(tile.row, tile.col) === "red" && (
                                        <View
                                            pointerEvents="none"
                                            style={styles.alertCameraVision}
                                        />
                                    )}
                                    {isCameraVision(tile.row, tile.col) === "source" && (
                                        <View
                                            pointerEvents="none"
                                            style={styles.sourceCameraVision
}                                        />
                                    )}
                                    <View style={styles.tileTextView}>
                                        {grid[tile.row][tile.col].numberUsed ? (
                                            <Text style={styles.tileTextUsed}>-1</Text>
                                        ) : (
                                            <Text style={styles.tileText}>{grid[tile.row][tile.col].number}</Text>     
                                        )}

                                    </View>
                                    
                                    {isAvailableMove(tile.row, tile.col) && (
                                        <View style={styles.moveOverlay} />
                                    )}
                                    {isAvailableInteraction(tile.row, tile.col) && (
                                        <View style={styles.interactionTile} />
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
                    <Image
                        source={require("../assets/player.png")}
                        style={{
                            width: tileSize * 0.9,
                            height: tileSize * 0.9,
                            position: "absolute"
                        }}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>
            <View style={styles.threeNumbers}>
                <View style={styles.numberContainer}>
                    <Text style={{fontSize: 25}}>Dice One: {dice.diceOne}</Text> 
                    <Pressable onPress={() => handleDiceRoll("diceOne")}>
                        <Text style={{fontSize: 25, fontWeight: "bold"}}>Roll Dice One</Text>
                    </Pressable>
                </View>
                <View style={styles.numberContainer}>
                    <Text style={{fontSize: 25}}>Dice Two: {dice.diceTwo}</Text>
                    <Pressable onPress={() => handleDiceRoll("diceTwo")}>
                        <Text style={{fontSize: 25, fontWeight: "bold"}}>Roll Dice Two</Text>
                    </Pressable>
                </View>
                <View style={styles.numberContainer}>
                    <Pressable onPress={() => handleDiceRoll("both")}>
                        <Text style={{fontSize: 25, fontWeight: "bold"}}>Roll Both</Text>
                    </Pressable>
                </View>
            </View>
            <View style={styles.threeNumbers}>
                <View style={styles.numberContainer}>
                    <Text style={{fontSize: 25}}>{currentEvent?.firstNumber}</Text> 
                </View>
                <View style={styles.numberContainer}>
                    <Text style={{fontSize: 25}}>{currentEvent?.secondNumber}</Text>
                </View>
                <View style={styles.numberContainer}>
                    <Text style={{fontSize: 25}}>{currentEvent?.thirdNumber}</Text>
                </View>
            </View>
            <View>
                <Text>{currentEvent?.Text}</Text>
            </View>
            {/*
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
            */}
        </View>
    );
};

const styles = StyleSheet.create({

    tileBackground: {
        ...StyleSheet.absoluteFill
    },
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
        alignItems: "center",
        backgroundColor: "#afafaf",
    },

    grid: {
        width: "96%",
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

    tileTextView: {
        backgroundColor: "rgba(0, 0, 0)",
        justifyContent: "center",
        alignItems: "center",   
    },

    tileText: {
        fontSize: 50,
        fontWeight: "bold",
        color: "#fff",
    },

    tileTextUsed: {
        fontSize: 50,
        fontWeight: "bold",
        color: "#f00",
    },

    controls: {
        width: "96%",
        paddingTop: 10,
        paddingBottom: 8,
    },

    stats: {
        width: "96%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },

    controlText: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
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

    threeNumbers: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "96%",
        paddingVertical: 8,
    },

    numberContainer: {
        flexDirection: "column",
        justifyContent: "space-between",
        paddingVertical: 8,
    },

    // PLAYER MOVEMENT 

    moveOverlay: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 120, 255, 0.35)",
    },

    // VISION 

    guardVision: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 220, 0, 0.70)",
    },

    alertVision: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 0, 0, 0.70)",
    },

    cameraVision: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#026a1d",
        opacity: 0.5,
        
    },

    alertCameraVision: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#c94b4b",
        opacity: 0.45,
    },

    sourceCameraVision: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#026a1d",
        opacity: 0.50,
        borderWidth: 3,
        borderColor: "#17cbeb"
    },

    interactionTile: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#7653a6",
        opacity: 0.70,
    },

    // WALLS 
    
    wallTile: {
        backgroundColor: "#7653a6",
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

    guardImage: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },
    // CAMERAS

    cameraImage: {
        position: "absolute",
        width: "100%",
        height: "100%",
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
    itemImage: {
        position: "absolute",
        width: "100%",
        height: "100%",
    },
});

export default Game;    
