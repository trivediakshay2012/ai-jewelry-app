import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const adminEmails = String(process.env.EXPO_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleAdminLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Signing in...');
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
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error('This account is not marked as admin.');
      }

      setStatusMessage('Admin verified. Redirecting...');
      router.replace('/admin-dashboard' as any);
    } catch (error: any) {
      const message = error?.message || 'Admin sign-in failed.';
      setStatusMessage(message);
      Alert.alert('Admin login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>Sign in with an account marked as admin in Supabase profiles.role or EXPO_PUBLIC_ADMIN_EMAILS.</Text>

        <TextInput style={styles.input} placeholder="Admin email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        {!!statusMessage && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAdminLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Open Admin Dashboard'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vendor-login' as any)}>
          <Text style={styles.secondaryButtonText}>Back to Vendor Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginTop: 20 },
  subtitle: { fontSize: 15, color: '#666', marginTop: 8, marginBottom: 20, lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, marginBottom: 14, backgroundColor: '#fff' },
  statusBox: { borderWidth: 1, borderColor: '#E5D2B0', backgroundColor: '#FFF7E8', borderRadius: 14, padding: 14, marginBottom: 14 },
  statusText: { color: '#5D5248', lineHeight: 20 },
  button: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#111', fontSize: 15, fontWeight: '700' },
});
