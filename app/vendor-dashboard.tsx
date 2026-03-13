import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesign } from '../context/DesignContext';
import { vendorStock } from '../lib/vendorInventory';

export default function VendorDashboardScreen() {
  const { addToCart, applyVendorInspiration, cartItems } = useDesign();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Marketplace + Custom Design</Text>
        <Text style={styles.title}>Vendor stock that can be bought now or used as design inspiration</Text>
        <Text style={styles.subtitle}>
          Browse ready inventory, add pieces to cart, buy directly, or launch the custom design flow from any vendor product.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/chat')}>
            <Text style={styles.primaryButtonText}>Start Fresh Design</Text>
          </TouchableOpacity>
          <View style={styles.cartPill}>
            <Text style={styles.cartPillText}>Cart {cartItems.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}><Text style={styles.metricValue}>Ready stock</Text><Text style={styles.metricLabel}>Shoppable vendor inventory for MVP</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricValue}>Use as inspiration</Text><Text style={styles.metricLabel}>Sends users into the dynamic questionnaire</Text></View>
      </View>

      {vendorStock.map((item) => (
        <View key={item.id} style={styles.productCard}>
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          <View style={styles.productMeta}>
            <Text style={styles.vendorName}>{item.vendorName}</Text>
            <Text style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.productDescription}>{item.description}</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>{item.category}</Text>
              <Text style={styles.tag}>{item.metalPurity} {item.metal}</Text>
              <Text style={styles.tag}>{item.market.toUpperCase()}</Text>
            </View>
            <Text style={styles.price}>{item.currency} {item.price.toLocaleString()}</Text>
            <Text style={styles.stockText}>{item.inventoryCount} available now</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => addToCart(item)}>
                <Text style={styles.secondaryButtonText}>Add to cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/saved-designs')}>
                <Text style={styles.secondaryButtonText}>Buy now</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.primaryWideButton}
              onPress={() => {
                applyVendorInspiration(item);
                router.push('/chat');
              }}
            >
              <Text style={styles.primaryButtonText}>Take as inspiration</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F4EE' },
  content: { padding: 18, paddingBottom: 32, gap: 16 },
  heroCard: {
    backgroundColor: '#1B1714',
    borderRadius: 24,
    padding: 22,
  },
  eyebrow: { color: '#D5C4A1', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  title: { color: '#FFF8EC', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { color: '#E3D5C2', fontSize: 15, lineHeight: 22, marginTop: 12 },
  heroActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  primaryButton: { backgroundColor: '#C79C59', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999 },
  primaryWideButton: { backgroundColor: '#1B1714', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginTop: 14 },
  primaryButtonText: { color: '#FFF8EC', fontWeight: '700' },
  cartPill: { backgroundColor: '#2D2824', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  cartPillText: { color: '#FFF8EC', fontWeight: '600' },
  metricRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EDE2D0' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#1B1714' },
  metricLabel: { marginTop: 6, color: '#6E6258', lineHeight: 20 },
  productCard: { backgroundColor: '#FFFDF9', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE2D0', marginTop: 14 },
  productImage: { width: '100%', height: 220, backgroundColor: '#EFE8DE' },
  productMeta: { padding: 18 },
  vendorName: { color: '#9B7B45', fontWeight: '700', marginBottom: 6 },
  productTitle: { fontSize: 22, fontWeight: '700', color: '#1B1714' },
  productDescription: { marginTop: 8, color: '#5D5248', lineHeight: 21 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { backgroundColor: '#F4EADC', color: '#6A5641', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  price: { marginTop: 14, fontSize: 20, fontWeight: '700', color: '#1B1714' },
  stockText: { color: '#6E6258', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryButton: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D7C2A0', paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#6A5641', fontWeight: '700' },
});
