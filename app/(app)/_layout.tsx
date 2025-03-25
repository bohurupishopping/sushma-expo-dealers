import { View } from 'react-native';
import { Stack } from 'expo-router';
import BottomNavigation from '@/components/BottomNavigation';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <BottomNavigation />
    </View>
  );
}