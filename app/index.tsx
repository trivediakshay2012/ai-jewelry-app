import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesign } from '../context/DesignContext';

export default function WelcomeScreen() {
  const { cartItems, vendorInspirationItem } = useDesign();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Luxury custom jewelry platform</Text>
        <Text style={styles.title}>Elegant shopping, custom design, and vendor inventory in one mobile flow</Text>
        <Text style={styles.subtitle}>
          Inspired by premium jewelry ecommerce layouts: clean merchandising, refined spacing, strong product storytelling, and a polished luxury visual tone.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/chat')}>
            <Text style={styles.primaryButtonText}>Start Designing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/vendor-dashboard')}>
            <Text style={styles.secondaryButtonText}>Browse Vendor Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Dynamic questionnaire</Text>
          <Text style={styles.infoText}>Every jewelry type gets its own schema-driven design flow.</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Marketplace ready</Text>
          <Text style={styles.infoText}>Add to cart, buy now, or use inventory as inspiration.</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current session</Text>
        <Text style={styles.statusLine}>Cart items: {cartItems.length}</Text>
        <Text style={styles.statusLine}>Vendor inspiration: {vendorInspirationItem ? vendorInspirationItem.title : 'None selected yet'}</Text>
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
});
