import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Database } from '@/types/supabase';

// Implement localStorage for web platform
const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

const webStorage = isBrowser
  ? {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (e) {
          return Promise.reject(e);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve(undefined);
        } catch (e) {
          return Promise.reject(e);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve(undefined);
        } catch (e) {
          return Promise.reject(e);
        }
      },
    }
  : {
      getItem: (_key: string) => Promise.resolve(null),
      setItem: (_key: string, _value: string) => Promise.resolve(undefined),
      removeItem: (_key: string) => Promise.resolve(undefined),
    };

// Use SecureStore on native platforms, localStorage on web
const storage = Platform.OS === 'web' ? webStorage : {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});