import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

function showMessage(title: string, message: string, onDone?: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    onDone?.();
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', onPress: () => onDone?.() }]);
}

export default function VendorLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVendorLogin = async () => {
    try {
      setErrorText('');

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        setErrorText('Enter your email and password.');
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.log('Vendor login error:', error);
        setErrorText(error.message || 'Could not sign in.');
        return;
      }

      const authUser = data.user;
      if (!authUser?.id) {
        setErrorText('Login succeeded, but no user session was returned.');
        return;
      }

      const vendorLookup = await supabase
        .from('vendors')
        .select('id, business_name, user_id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (vendorLookup.error) {
        console.log('Vendor profile lookup error:', vendorLookup.error);
        setErrorText(vendorLookup.error.message || 'Could not load vendor profile.');
        return;
      }

      if (!vendorLookup.data) {
        showMessage(
          'Vendor setup incomplete',
          'Your login worked, but this account is not linked to a vendor profile yet. Complete vendor signup first.',
          () => router.replace('/vendor-signup' as any)
        );
        return;
      }

      router.replace('/vendor-dashboard' as any);
    } catch (error: any) {
      console.log('Vendor login load failed:', error);
      setErrorText(error?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setErrorText('');
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        setErrorText('Enter your email first so we can send the reset link.');
        return;
      }

      setLoading(true);

      const redirectTo =
        process.env.EXPO_PUBLIC_APP_BASE_URL
          ? `${process.env.EXPO_PUBLIC_APP_BASE_URL}/vendor-login`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });

      if (error) {
        console.log('Vendor forgot password error:', error);
        setErrorText(error.message || 'Could not send reset email.');
        return;
      }

      showMessage('Reset email sent', 'Check your inbox for the password reset link.');
    } catch (error: any) {
      console.log('Vendor forgot password load failed:', error);
      setErrorText(error?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Vendor Log In</Text>
      <Text style={styles.subtitle}>
        Sign in to manage your store, leads, invite link, and vendor dashboard.
      </Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (errorText) setErrorText('');
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Vendor email"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (errorText) setErrorText('');
        }}
        secureTextEntry
        placeholder="Password"
        editable={!loading}
      />

      {!!errorText && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleVendorLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
        <Text style={styles.linkText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/vendor-signup' as any)}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Create Vendor Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.adminButton}
        onPress={() => router.push('/admin-login' as any)}
        disabled={loading}
      >
        <Text style={styles.adminButtonText}>Go to Admin Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    justifyContent: 'center',
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5D5248',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D8C7AA',
    backgroundColor: '#F5F6BE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#E5D2B0',
    backgroundColor: '#F3ECDD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  errorText: {
    color: '#5D5248',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#05060A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 16,
  },
  adminButton: {
    borderWidth: 1,
    borderColor: '#C9A15B',
    backgroundColor: '#F7F0DF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#8A6B2F',
    fontWeight: '700',
    fontSize: 16,
  },
  linkText: {
    color: '#8A6B2F',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});