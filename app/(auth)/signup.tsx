import { useState, useEffect } from 'react';
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
import { Lock, Mail, User, ArrowRight, CircleAlert as AlertCircle, Check } from 'lucide-react-native';
import { Link } from 'expo-router';
import { z } from 'zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import React from 'react';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

export default function Signup() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^A-Za-z0-9]/)) strength += 25;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(password);

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 25) return '#ef4444';
    if (strength <= 50) return '#f97316';
    if (strength <= 75) return '#eab308';
    return '#10b981';
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  const handleSignup = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!acceptTerms) {
        throw new Error('Please accept the terms and conditions');
      }

      // Validate input
      signupSchema.parse({ email, password, displayName });

      const { error } = await signUp(email, password, displayName);
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
        source={{ uri: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=800&auto=format&fit=crop&q=80' }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={40}
      />

      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join our dealer network and grow your business
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.duration(1000).springify()}
        style={styles.formContainer}>
        {error && (
          <Animated.View 
            entering={FadeInUp.duration(400)}
            style={styles.errorContainer}>
            <AlertCircle size={20} color="#f87171" strokeWidth={2.5} />
            <Text style={styles.errorText}>{error}</Text>
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
          <User color="#6366f1" size={20} strokeWidth={2.5} />
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor="#94a3b8"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        <View>
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
          {password && (
            <Animated.View 
              entering={FadeInUp.duration(300)}
              style={styles.passwordStrength}>
              <View style={styles.strengthMeter}>
                <Animated.View 
                  style={[
                    styles.strengthIndicator,
                    { 
                      width: `${passwordStrength}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength)
                    }
                  ]}
                />
              </View>
              <Text style={[
                styles.strengthText,
                { color: getPasswordStrengthColor(passwordStrength) }
              ]}>
                {getPasswordStrengthLabel(passwordStrength)}
              </Text>
            </Animated.View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Lock color="#6366f1" size={20} strokeWidth={2.5} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#94a3b8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        

        <AnimatedTouchableOpacity
          entering={FadeInUp.duration(400).delay(200)}
          style={styles.button}
          onPress={handleSignup}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Create Account</Text>
              <ArrowRight color="#ffffff" size={20} strokeWidth={2.5} />
            </>
          )}
        </AnimatedTouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign In</Text>
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
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: '#f87171',
    fontSize: 14,
    letterSpacing: 0.3,
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
  passwordStrength: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthMeter: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthIndicator: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  termsText: {
    fontSize: 14,
    color: '#64748b',
  },
  termsLink: {
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