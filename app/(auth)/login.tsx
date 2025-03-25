import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { Lock, Mail, ArrowRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Link } from 'expo-router';
import { z } from 'zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import React from 'react';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);

      // Validate input
      loginSchema.parse({ email, password });

      const { error } = await signIn(email, password, rememberMe);
      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof z.ZodError
          ? err.errors[0].message
          : err instanceof Error
          ? err.message
          : 'An error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80' }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={70}
      />
      
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to your dealer account to continue
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.duration(1000).springify()}
        style={styles.formContainer}>
        {error && (
          <Animated.View 
            entering={FadeInUp.duration(400)}
            style={[
              styles.errorContainer,
              error.includes('deactivated') && styles.deactivatedError
            ]}>
            <AlertCircle 
              size={20} 
              color={error.includes('deactivated') ? '#ef4444' : '#f87171'} 
              strokeWidth={2.5}
            />
            <Text style={[
              styles.errorText,
              error.includes('deactivated') && styles.deactivatedErrorText
            ]}>
              {error}
            </Text>
          </Animated.View>
        )}

        <View style={styles.inputContainer}>
          <Mail color="#6366f1" size={20} strokeWidth={2.5} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock color="#6366f1" size={20} strokeWidth={2.5} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}>
            <View style={[
              styles.checkbox,
              rememberMe && styles.checkboxChecked
            ]}>
              {rememberMe && (
                <View style={styles.checkboxInner} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Remember me</Text>
          </TouchableOpacity>

          <Link href="/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <AnimatedTouchableOpacity
          entering={FadeInUp.duration(400).delay(200)}
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Sign In</Text>
              <ArrowRight color="#ffffff" size={20} strokeWidth={2.5} />
            </>
          )}
        </AnimatedTouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  deactivatedError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: '#f87171',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  deactivatedErrorText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    marginRight: 8,
  },
  footerLink: {
    color: '#6366f1',
    fontWeight: '600',
  },
});