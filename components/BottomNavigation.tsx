import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Chrome as Home, FileText, Plus, Wallet, User } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useState } from 'react';
import NewOrderModal from '@/components/NewOrderModal';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AppRoute = '/' | '/orders' | '/finance' | '/profile';

type Route = {
  name: string;
  icon: React.ElementType;
  path?: AppRoute;
  isSpecial?: boolean;
};

const routes: Route[] = [
  {
    name: 'Home',
    icon: Home,
    path: '/',
  },
  {
    name: 'Orders',
    icon: FileText,
    path: '/orders',
  },
  {
    name: 'New',
    icon: Plus,
    isSpecial: true,
  },
  {
    name: 'Finance',
    icon: Wallet,
    path: '/finance',
  },
  {
    name: 'Profile',
    icon: User,
    path: '/profile',
  },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  return (
    <>
      <Animated.View 
        entering={FadeIn.duration(1000).springify()}
        style={styles.container}>
        <View style={styles.background} />
        <View style={styles.content}>
          {routes.map((route, index) => {
            const isActive = pathname === route.path;
            
            if (route.isSpecial) {
              return (
                <AnimatedPressable
                  key={route.name}
                  style={styles.tab}
                  onPress={() => setShowNewOrderModal(true)}>
                  <View style={styles.specialIconContainer}>
                    <route.icon
                      size={24}
                      color="#ffffff"
                      strokeWidth={2.5}
                    />
                  </View>
                </AnimatedPressable>
              );
            }

            return (
              <AnimatedPressable
                key={route.name}
                style={styles.tab}
                onPress={() => route.path && router.push(route.path as any)}>
                <View style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer
                ]}>
                  <route.icon
                    size={24}
                    color={isActive ? '#6366f1' : '#94a3b8'}
                    strokeWidth={2.5}
                  />
                </View>
                <Text style={[
                  styles.label,
                  isActive && styles.activeLabel
                ]}>
                  {route.name}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </Animated.View>

      <NewOrderModal
        visible={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSuccess={() => {
          setShowNewOrderModal(false);
          router.push('/orders');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  content: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  activeIconContainer: {
    backgroundColor: '#e0e7ff',
    borderColor: '#818cf8',
    transform: [{ scale: 1.05 }],
  },
  specialIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -32,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#6366f1',
    fontWeight: '700',
  },
});