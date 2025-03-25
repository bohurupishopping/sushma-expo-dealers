import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { FileText, Clock, Wallet, User } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { NavItem } from '@/types/routes';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Dashboard() {
  const { profile } = useAuth();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      title: 'Orders',
      description: 'View and manage orders',
      icon: FileText,
      route: '/orders',
      color: '#818cf8',
      gradient: ['#818cf8', '#6366f1'],
    },
    {
      title: 'Processing',
      description: 'Track order processing',
      icon: Clock,
      route: '/processing',
      color: '#fb923c',
      gradient: ['#fb923c', '#f97316'],
    },
    {
      title: 'Finance',
      description: 'Financial overview',
      icon: Wallet,
      route: '/finance',
      color: '#34d399',
      gradient: ['#34d399', '#10b981'],
    },
    {
      title: 'Profile',
      description: 'Manage your profile',
      icon: User,
      route: '/profile',
      color: '#f472b6',
      gradient: ['#f472b6', '#ec4899'],
    },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80' }}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.9 }]}
            blurRadius={70}
          />
          <Animated.View 
            entering={FadeInDown.duration(600).springify()}
            style={styles.welcomeContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{profile?.display_name || profile?.email?.split('@')[0]}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.role}>Dealer Dashboard</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <View style={styles.navGrid}>
            {navItems.map((item, index) => (
              <AnimatedPressable
                key={item.title}
                entering={FadeInUp.duration(400).delay(200 + index * 100)}
                style={[styles.navItem, { borderColor: `${item.color}20` }]}
                onPress={() => router.push(item.route as any)}>
                <View style={[styles.navIcon, { backgroundColor: `${item.color}15` }]}>
                  <item.icon size={26} color={item.color} strokeWidth={2} />
                </View>
                <Text style={[styles.navTitle, { color: item.gradient[1] }]}>{item.title}</Text>
                <Text style={styles.navDescription}>{item.description}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  header: {
    height: 240,
    backgroundColor: '#6366f1',
    overflow: 'hidden',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  greeting: {
    fontSize: 16,
    color: '#e0e7ff',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
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
    paddingBottom: 24,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  navItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  navIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  navDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
});