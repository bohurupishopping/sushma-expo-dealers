import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import React from 'react';

function RootLayoutNav() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isNoAccess = segments[1] === 'no-access';

    if (!session && !inAuthGroup) {
      // Not signed in, redirect to login
      router.replace('/login');
    } else if (session && inAuthGroup && !isNoAccess) {
      // Signed in, in auth group, not on no-access page
      router.replace('/');
    } else if (session && profile?.role !== 'dealer' && !isNoAccess) {
      // Signed in but not a dealer, redirect to no-access
      router.replace('/no-access');
    } else if (session && profile?.role === 'dealer' && isNoAccess) {
      // Dealer on no-access page, redirect to home
      router.replace('/');
    }
  }, [session, segments, isLoading, profile?.role]);

  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}