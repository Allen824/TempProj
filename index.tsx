import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity onPress={() => router.push('/game')}>
        <Text>Go to Game</Text>
      </TouchableOpacity>
    </View>
  );
}
