import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthRole } from '../components/AuthRoleContext';
import { useDesign } from '../context/DesignContext';
import { supabase } from '../lib/supabase';

export default function WelcomeScreen() {
  const { cartItems, vendorInspirationItem, setCartItems } = useDesign();
  const { user, isAdmin, isVendor, loading } = useAuthRole();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Luxury custom jewelry platform</Text>
        <Text style={styles.title}>
          Browse vendor inventory, design your own jewelry, and request quotes in one seamless flow
        </Text>
        <Text style={styles.subtitle}>
          Customers can shop vendor catalog pieces, use them as inspiration for custom designs, or
          create their own design from scratch and request a quote immediately.
        </Text>

        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/vendor-catalog' as any)}>
            <Text style={styles.primaryButtonText}>Browse Vendor Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/chat' as any)}>
            <Text style={styles.secondaryButtonText}>Start Custom Design</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Vendor catalog</Text>
          <Text style={styles.infoText}>
            Buy, add to cart, request a quote, or use any item as inspiration.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Custom quote flow</Text>
          <Text style={styles.infoText}>
            Create your own design and request a quote directly or choose a jeweler.
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current session</Text>
        <Text style={styles.statusLine}>
          Logged in: {loading ? 'Checking...' : user ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusLine}>Admin: {loading ? 'Checking...' : isAdmin ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusLine}>Vendor: {loading ? 'Checking...' : isVendor ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusLine}>Cart items: {cartItems.length}</Text>
        <Text style={styles.statusLine}>
          Vendor inspiration: {vendorInspirationItem ? vendorInspirationItem.title : 'None selected yet'}
        </Text>

        <View style={styles.sessionActions}>
          <TouchableOpacity style={styles.sessionButton} onPress={() => router.push('/cart' as any)}>
            <Text style={styles.sessionButtonText}>Open Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sessionButtonOutline} onPress={() => router.push('/saved-designs' as any)}>
            <Text style={styles.sessionButtonOutlineText}>Saved Designs</Text>
          </TouchableOpacity>
        </View>

        {user ? (
          <View style={styles.sessionActionsVertical}>
            {isAdmin ? (
              <TouchableOpacity style={styles.adminButtonOutline} onPress={() => router.push('/admin-dashboard' as any)}>
                <Text style={styles.adminButtonOutlineText}>Open Admin Dashboard</Text>
              </TouchableOpacity>
            ) : null}

            {isVendor ? (
              <TouchableOpacity style={styles.vendorButtonOutline} onPress={() => router.push('/vendor-dashboard' as any)}>
                <Text style={styles.vendorButtonOutlineText}>Open Vendor Dashboard</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.vendorCard}>
        <Text style={styles.vendorTitle}>For Jewelers and Vendors</Text>
        <Text style={styles.vendorText}>
          Create a vendor account, manage leads and quotes, and upload inventory so customers can
          browse your catalog directly from the app.
        </Text>

        <View style={styles.vendorActions}>
          <TouchableOpacity style={styles.vendorButton} onPress={() => router.push('/vendor-signup' as any)}>
            <Text style={styles.vendorButtonText}>Become a Vendor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.vendorButtonOutline} onPress={() => router.push('/vendor-login' as any)}>
            <Text style={styles.vendorButtonOutlineText}>Vendor Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminButtonOutline} onPress={() => router.push('/admin-login' as any)}>
            <Text style={styles.adminButtonOutlineText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F4EE' },
  content: { padding: 18, paddingBottom: 30 },

  heroCard: { backgroundColor: '#1C1714', borderRadius: 28, padding: 22, marginTop: 8 },
  eyebrow: { color: '#D9BD86', textTransform: 'uppercase', letterSpacing: 1.3, fontSize: 12, marginBottom: 10 },
  title: { color: '#FFF8EC', fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { color: '#E7DAC8', lineHeight: 22, marginTop: 12, fontSize: 15 },
  heroActions: { marginTop: 20, gap: 10 },
  primaryButton: { backgroundColor: '#C79C59', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#FFF8EC', fontWeight: '700', fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: '#CFAF7E', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#F4E8D8', fontWeight: '700', fontSize: 16 },

  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoCard: { flex: 1, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EDE2D0' },
  infoTitle: { fontSize: 17, fontWeight: '700', color: '#1B1714' },
  infoText: { color: '#675B51', lineHeight: 20, marginTop: 8 },

  statusCard: { marginTop: 16, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#EDE2D0' },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#1B1714', marginBottom: 8 },
  statusLine: { color: '#675B51', lineHeight: 22 },
  sessionActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  sessionActionsVertical: { marginTop: 14, gap: 10 },
  sessionButton: { flex: 1, backgroundColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  sessionButtonText: { color: '#fff', fontWeight: '700' },
  sessionButtonOutline: { flex: 1, borderWidth: 1, borderColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  sessionButtonOutlineText: { color: '#111', fontWeight: '700' },

  vendorCard: { marginTop: 16, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#EDE2D0' },
  vendorTitle: { fontSize: 18, fontWeight: '700', color: '#1B1714', marginBottom: 8 },
  vendorText: { color: '#675B51', lineHeight: 22, marginBottom: 14 },
  vendorActions: { gap: 10 },

  vendorButton: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  vendorButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  vendorButtonOutline: { borderWidth: 1, borderColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  vendorButtonOutlineText: { color: '#111', fontWeight: '700', fontSize: 15 },

  adminButtonOutline: { borderWidth: 1, borderColor: '#C79C59', borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFF7E8' },
  adminButtonOutlineText: { color: '#7A5B2E', fontWeight: '700', fontSize: 15 },

  signOutButton: { borderWidth: 1, borderColor: '#B42318', borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFF3F2' },
  signOutButtonText: { color: '#B42318', fontWeight: '700', fontSize: 15 },
});