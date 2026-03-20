import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { hapticError, hapticSuccess, hapticTap } from '../lib/haptics';
import { ensureVendorProfileForUser } from '../lib/vendorAuth';

const adminEmails = String(process.env.EXPO_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export default function VendorLoginScreen() {
  const params = useLocalSearchParams<{ email?: string; pendingVerification?: string }>();
  const [email, setEmail] = useState(String(params.email ?? ''));
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    params.pendingVerification === '1'
      ? 'Check your inbox, verify your email, and then log in here.'
      : ''
  );

  useEffect(() => {
    setEmail(String(params.email ?? ''));
  }, [params.email]);

  const handleLogin = async () => {
    await hapticTap();
    if (loading) return;
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter both email and password.');
      return;
    }

    setLoading(true);
    setStatusMessage('Signing in...');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Signed in, but user details were missing.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const role = String(profile?.role || data.user?.user_metadata?.role || '').trim().toLowerCase();
      const isAdmin = role === 'admin' || adminEmails.includes(normalizedEmail);

      if (isAdmin) {
        setStatusMessage('Admin account detected. Redirecting to admin dashboard...');
        router.replace('/admin-dashboard' as any);
        return;
      }

      await ensureVendorProfileForUser({ userId, email: normalizedEmail });

      setStatusMessage('Signed in successfully. Redirecting to your dashboard...');
      await hapticSuccess();
        router.replace('/vendor-dashboard' as any);
    } catch (error: any) {
      console.error('Vendor login failed:', error);
      const message = error?.message || 'Vendor login failed.';
      setStatusMessage(message);
      await hapticError();
      Alert.alert('Login error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email required', 'Enter your email first so we know where to send the reset link.');
      return;
    }

    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/vendor-login` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });
      if (error) throw error;
      setStatusMessage('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      const message = error?.message || 'Unable to send password reset email.';
      setStatusMessage(message);
      Alert.alert('Reset error', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Vendor Log In</Text>
        <Text style={styles.subtitle}>
          Sign in to manage your store, leads, invite link, and vendor dashboard.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {statusMessage ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleForgotPassword}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vendor-signup' as any)}>
          <Text style={styles.secondaryButtonText}>Create Vendor Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin-login' as any)}>
          <Text style={styles.adminButtonText}>Go to Admin Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginTop: 20 },
  subtitle: { fontSize: 15, color: '#666', marginTop: 8, marginBottom: 20, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  statusBox: {
    borderWidth: 1,
    borderColor: '#E5D2B0',
    backgroundColor: '#FFF7E8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  statusText: { color: '#5D5248', lineHeight: 20 },
  button: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkButton: { alignItems: 'center', marginTop: 14 },
  linkText: { color: '#7A5B2E', fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { color: '#111', fontSize: 15, fontWeight: '700' },
  adminButton: {
    borderWidth: 1,
    borderColor: '#C79C59',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFF7E8',
  },
  adminButtonText: { color: '#7A5B2E', fontSize: 15, fontWeight: '700' },
});