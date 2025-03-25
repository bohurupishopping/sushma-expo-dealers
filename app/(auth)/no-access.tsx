import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { 
  CircleAlert as AlertCircle,
  ShieldOff,
  Mail,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NoAccess() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?w=800&auto=format&fit=crop&q=80' }}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.9 }]}
        blurRadius={70}
      />
      
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        style={styles.header}>
        <View style={styles.iconContainer}>
          <ShieldOff size={40} color="#ef4444" strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.subtitle}>
          This application is only accessible to authorized dealers
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.duration(1000).delay(300).springify()}
        style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AlertCircle size={24} color="#ef4444" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>Current Access Level</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fce7f3' }]}>
              <User size={20} color="#ec4899" strokeWidth={2.5} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {profile?.role?.toUpperCase() || 'Not Set'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: '#fef2f2' }
            ]}>
              <Text style={styles.statusText}>Restricted</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#e0e7ff' }]}>
              <Mail size={20} color="#6366f1" strokeWidth={2.5} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>Need Access?</Text>
          <Text style={styles.messageText}>
            Please contact your administrator to request dealer access. Once approved, you'll be able to access all dealer features.
          </Text>
        </View>

        <AnimatedPressable
          entering={FadeIn.duration(1000).delay(600)}
          style={styles.signOutButton}
          onPress={handleSignOut}>
          <LogOut size={24} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#fee2e2',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});