import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';
import { Asset } from "expo-asset";
import { useEffect, useState } from "react";

export default function Index() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

useEffect(() => {
    const loadAssets = async () => {
        const assets = [
            require("../assets/woodFloor1.png"),
            require("../assets/woodFloorPowerOut1.png"),
            require("../assets/woodFloorPowerOut2.png"),
            require("../assets/closedDoorNorth.png"),
            require("../assets/closedDoorSouth.png"),
            require("../assets/closedDoorEast.png"),
            require("../assets/closedDoorWest.png"),
            require("../assets/openPowerDoorEast.png"),
            require("../assets/closedPowerDoorEast.png"),
            require("../assets/openPowerDoorNorth.png"),
            require("../assets/closedPowerDoorNorth.png"),
            require("../assets/openPowerDoorNorth.png"),
            require("../assets/closedPowerDoorNorth.png"),
            require("../assets/openPowerDoorWest.png"),
            require("../assets/closedPowerDoorWest.png"),
            require("../assets/openPowerDoorSouth.png"),
            require("../assets/closedPowerDoorSouth.png"),

            require("../assets/standardGuard.png"),
            require("../assets/keyItem.png"),
            require("../assets/blindItem.png"),
            require("../assets/photoEvidence.png"),

            require("../assets/northWall.png"),
            require("../assets/southWall.png"),
            require("../assets/eastWall.png"),
            require("../assets/westWall.png"),

            require("../assets/northPowerWall.png"),
            require("../assets/southPowerWall.png"),
            require("../assets/eastPowerWall.png"),
            require("../assets/westPowerWall.png"),

            require("../assets/northBrittleWall.png"),
            require("../assets/southBrittleWall.png"),
            require("../assets/eastBrittleWall.png"),
            require("../assets/westBrittleWall.png"),
        ];

        await Promise.all(
            assets.map(asset =>
                Asset.fromModule(asset).downloadAsync()
            )
        );

        setAssetsLoaded(true);
    };

    loadAssets();
}, []);
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        disabled={!assetsLoaded}
        onPress={() => router.push("/game")}
    >
        <Text>
            {assetsLoaded ? "Go to Game" : "Loading..."}
        </Text>
    </TouchableOpacity>
    </View>
  );
}
