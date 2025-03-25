import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, RefreshControl } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { 
  LogOut, 
  Mail, 
  User, 
  Building2, 
  Shield, 
  Clock, 
  CircleAlert as AlertCircle, 
  Settings, 
  Bell, 
  CircleHelp as HelpCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

type Profile = Database['public']['Tables']['profiles']['Row'];

// Cache keys
const CACHE_KEYS = {
  PROFILE: 'profile_cache',
  LAST_FETCH: 'profile_last_fetch',
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const menuItems = [
  {
    icon: Settings,
    title: 'Account Settings',
    subtitle: 'Manage your account preferences',
    color: '#6366f1',
  },
  {
    icon: Bell,
    title: 'Notifications',
    subtitle: 'Configure your notification settings',
    color: '#f97316',
  },
  {
    icon: HelpCircle,
    title: 'Help & Support',
    subtitle: 'Get help with your account',
    color: '#10b981',
  },
];

export default function Profile() {
  const { profile: authProfile, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load cached data
  const loadCachedData = useCallback(async () => {
    try {
      const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH);
      const now = Date.now();
      
      if (lastFetch && now - parseInt(lastFetch) < CACHE_DURATION) {
        const cachedProfile = await AsyncStorage.getItem(CACHE_KEYS.PROFILE);
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  }, []);

  // Save data to cache
  const saveToCache = useCallback(async (profile: Profile) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString())
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch fresh data
  const fetchProfile = useCallback(async () => {
    try {
      if (!authProfile?.user_id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authProfile.user_id)
        .single();

      if (error) throw error;
      setProfile(data);
      await saveToCache(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch profile data'
      );
    } finally {
      setLoading(false);
    }
  }, [authProfile?.user_id, saveToCache]);

  // Initial load
  useEffect(() => {
    if (authProfile?.user_id) {
      loadCachedData().then(hasCachedData => {
        if (!hasCachedData) {
          fetchProfile();
        }
      });
    }
  }, [authProfile?.user_id, loadCachedData, fetchProfile]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle color="#ef4444" size={48} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchProfile}>
            <RefreshCw size={20} color="#ef4444" strokeWidth={2.5} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#6366f1"
          colors={['#6366f1']}
          progressBackgroundColor="#ffffff"
        />
      }>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=800&auto=format&fit=crop&q=80' }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.9 }]}
          blurRadius={70}
        />
        <Animated.View 
          entering={FadeIn.duration(600).springify()}
          style={styles.avatarContainer}>
          <View style={styles.avatarInner}>
            <User size={40} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View style={styles.avatarBadge} />
        </Animated.View>
        <Animated.View
          entering={FadeIn.duration(600).delay(200).springify()}
          style={styles.headerContent}>
          <Text style={styles.name}>{profile?.display_name || 'Dealer'}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.role}>{profile?.role?.toUpperCase()}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.content}>
        <Animated.View 
          entering={FadeInRight.duration(600).delay(400).springify()}
          style={styles.section}>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.iconWrapper, { backgroundColor: '#e0e7ff' }]}>
                <Mail color="#6366f1" size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText}>{authProfile?.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fce7f3' }]}>
                <User color="#ec4899" size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText}>
                {profile?.display_name || 'Not set'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconWrapper, { backgroundColor: '#f0fdf4' }]}>
                <Building2 color="#10b981" size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText}>{profile?.role}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fff7ed' }]}>
                <Shield color="#f97316" size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText}>
                Status:{' '}
                <Text style={[
                  styles.statusBadge,
                  { color: profile?.status === 'active' ? '#059669' : '#dc2626' }
                ]}>
                  {profile?.status?.toUpperCase()}
                </Text>
              </Text>
            </View>

            <View style={[styles.infoRow, styles.lastRow]}>
              <View style={[styles.iconWrapper, { backgroundColor: '#f1f5f9' }]}>
                <Clock color="#64748b" size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText}>
                Joined:{' '}
                {new Date(profile?.created_at || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <AnimatedTouchableOpacity
              key={item.title}
              entering={FadeInRight.duration(400).delay(600 + index * 100)}
              style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <item.icon size={24} color={item.color} strokeWidth={2.5} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </AnimatedTouchableOpacity>
          ))}
        </View>

        <AnimatedTouchableOpacity
          entering={FadeInRight.duration(400).delay(900)}
          style={styles.signOutButton}
          onPress={signOut}>
          <LogOut color="#ef4444" size={24} strokeWidth={2.5} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </AnimatedTouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
  },
  header: {
    height: 320,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  roleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  role: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    marginTop: -48,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 0.2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fee2e2',
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    letterSpacing: 0.3,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});