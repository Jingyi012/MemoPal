import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-3">
        <Text className="text-2xl">This screen doesn&apos;t exist.</Text>
        <View className="h-2" />
        <Link href="/">
          <Text>Go Home</Text>
        </Link>
      </View>
    </>
  );
}
