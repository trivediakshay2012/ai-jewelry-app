import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { createNotificationEvent } from '../lib/notificationEvents';
import { supabase } from '../lib/supabase';
import { hapticError, hapticSuccess, hapticTap } from '../lib/haptics';
import {
  createOrUpdateVendorProfile,
  savePendingVendorSignup,
} from '../lib/vendorAuth';
import { getLocalizedPlanPricing, normalizePlan } from '../lib/vendorSubscriptions';

export default function VendorSignupScreen() {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'basic' | 'pro' | 'premium'>('basic');
  const [planPreview, setPlanPreview] = useState<Record<string, any>>({});
  const [statusMessage, setStatusMessage] = useState('');

  const payload = useMemo(
    () => ({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      country: country.trim(),
      city: city.trim(),
      website: website.trim(),
      specialization: specialization.trim(),
      subscriptionPlan,
    }),
    [businessName, ownerName, email, phone, country, city, website, specialization, subscriptionPlan]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const plans = await Promise.all(['basic', 'pro', 'premium'].map(async (plan) => [plan, await getLocalizedPlanPricing(plan, country || 'United States')]));
      if (active) setPlanPreview(Object.fromEntries(plans));
    })();
    return () => { active = false; };
  }, [country]);

  const handleSubmit = async () => {
    await hapticTap();
    if (loading) return;

    if (!payload.businessName || !payload.ownerName || !payload.email || !payload.country) {
      Alert.alert('Missing fields', 'Please complete business name, owner name, email, and country.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Password required', 'Use a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirm password must match.');
      return;
    }

    setLoading(true);
    setStatusMessage('Creating vendor account...');

    try {
      savePendingVendorSignup(payload);

      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/vendor-login` : undefined,
          data: {
            role: 'vendor',
            business_name: payload.businessName,
            owner_name: payload.ownerName,
            subscription_plan: normalizePlan(payload.subscriptionPlan),
          },
        },
      });

      if (error) throw error;

      const hasSession = Boolean(data.session);
      const userId = data.user?.id;

      if (hasSession && userId) {
        await createOrUpdateVendorProfile({ ...payload, userId });
        try {
          await createNotificationEvent({
            audience: 'admin',
            channel: 'email_ready',
            title: 'New vendor application',
            body: `${payload.businessName} signed up for the ${payload.subscriptionPlan} plan and is awaiting approval.`,
            recipientEmail: null,
            referenceType: 'vendor_application',
            referenceId: userId,
            metadata: { plan: payload.subscriptionPlan, country: payload.country },
          });
        } catch {}
        setStatusMessage('Vendor account created. Redirecting to your dashboard...');
        router.replace('/vendor-dashboard');
        return;
      }

      setStatusMessage(
        'Account created successfully. Please verify your email from your inbox, then log in to finish opening your vendor dashboard.'
      );
      Alert.alert(
        'Verify your email',
        'We created your vendor account. Please open your inbox, verify the email address, then come back and log in.'
      );
      router.replace({ pathname: '/vendor-login', params: { email: payload.email, pendingVerification: '1' } });
    } catch (error: any) {
      console.error('Vendor signup failed:', error);
      const message = error?.message || 'Vendor signup failed.';
      const alreadyExists =
        typeof message === 'string' &&
        (message.toLowerCase().includes('already registered') ||
          message.toLowerCase().includes('already been registered') ||
          message.toLowerCase().includes('security purposes'));

      setStatusMessage(
        alreadyExists
          ? 'This email may already have a pending account. Check your inbox for the verification email, then log in.'
          : message
      );
      await hapticError();
      Alert.alert('Signup error', alreadyExists ? 'Check your inbox for the verification email, then log in.' : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Vendor Sign Up</Text>
        <Text style={styles.subtitle}>Create your jeweler account, verify your email if required, and then log in to manage your store.</Text>

        <TextInput style={styles.input} placeholder="Business Name *" value={businessName} onChangeText={setBusinessName} />
        <TextInput style={styles.input} placeholder="Owner Name *" value={ownerName} onChangeText={setOwnerName} />
        <TextInput style={styles.input} placeholder="Email *" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password *" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirm Password *" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Country *" value={country} onChangeText={setCountry} />
        <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
        <TextInput style={styles.input} placeholder="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Specialization (comma separated)"
          value={specialization}
          onChangeText={setSpecialization}
          multiline
        />

        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Choose your vendor plan</Text>
          <Text style={styles.planSubtitle}>All vendor plans include a 7-day free trial. Prices are shown in your selected country currency when available.</Text>
          {(['basic', 'pro', 'premium'] as const).map((plan) => {
            const preview = planPreview[plan];
            const active = subscriptionPlan === plan;
            return (
              <TouchableOpacity key={plan} style={[styles.planOption, active && styles.planOptionActive]} onPress={() => setSubscriptionPlan(plan)}>
                <Text style={[styles.planOptionTitle, active && styles.planOptionTitleActive]}>{String(plan).charAt(0).toUpperCase() + String(plan).slice(1)}</Text>
                <Text style={[styles.planOptionText, active && styles.planOptionTextActive]}>{preview?.monthlyDisplay || 'Loading...'} / month</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {statusMessage ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Vendor Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vendor-login')}>
          <Text style={styles.secondaryButtonText}>Already have an account? Log In</Text>
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  planCard: { borderWidth: 1, borderColor: '#E5D2B0', backgroundColor: '#FFF7E8', borderRadius: 14, padding: 14, marginBottom: 14, gap: 10 },
  planTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  planSubtitle: { color: '#5D5248', lineHeight: 20 },
  planOption: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  planOptionActive: { borderColor: '#C79C59', backgroundColor: '#FFF1D8' },
  planOptionTitle: { fontWeight: '700', color: '#111' },
  planOptionTitleActive: { color: '#8a5b12' },
  planOptionText: { marginTop: 4, color: '#5D5248' },
  planOptionTextActive: { color: '#8a5b12' },
  statusBox: { borderWidth: 1, borderColor: '#E5D2B0', backgroundColor: '#FFF7E8', borderRadius: 14, padding: 14, marginBottom: 14 },
  statusText: { color: '#5D5248', lineHeight: 20 },
  button: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#111', fontSize: 15, fontWeight: '700' },
});
