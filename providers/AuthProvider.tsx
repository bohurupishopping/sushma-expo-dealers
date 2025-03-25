import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data.status !== 'active') {
        await signOut();
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        throw new Error('An account with this email already exists');
      }

      // Sign up with auth and set display name in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role: 'user', // Fixed role as "user"
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Wait for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          user_id: authData.user.id,
          display_name: displayName,
          role: 'user',
          status: 'active',
          email: email,
        },
      ]);

      if (profileError) throw profileError;

      return { error: null, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('An error occurred'),
        success: false,
      };
    }
  };

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check profile status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.status !== 'active') {
        await signOut();
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Set session persistence if remember me is checked
      if (rememberMe && data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return { error: null, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('An error occurred'),
        success: false,
      };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setSession(null);
      setProfile(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear local state even if there's an error
      setSession(null);
      setProfile(null);
    }
  };

  const value = {
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}