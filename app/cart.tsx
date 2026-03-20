import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesign } from '../context/DesignContext';

function formatPrice(value: unknown, currency?: string) {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${currency || 'USD'} ${safeAmount.toLocaleString()}`;
}

export default function CartScreen() {
  const { cartItems, setCartItems } = useDesign();

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const handleCheckout = () => {
    router.push('/checkout' as any);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.subtitle}>Saved vendor catalog pieces for purchase or later inspiration.</Text>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Browse vendor inventory and add products here.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/vendor-catalog' as any)}>
            <Text style={styles.primaryButtonText}>Browse Vendor Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.vendorName}</Text>
              <Text style={styles.itemMeta}>{formatPrice(item.price, item.currency)}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineButton} onPress={() => router.push('/vendor-catalog' as any)}>
                  <Text style={styles.outlineButtonText}>Keep Shopping</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Estimated total</Text>
            <Text style={styles.summaryValue}>${total.toLocaleString()}</Text>
            <Text style={styles.summaryText}>Taxes, shipping, and final vendor confirmation are reviewed on the next step.</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleCheckout}>
            <Text style={styles.primaryButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F4EE' },
  content: { padding: 18, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', color: '#1B1714', marginTop: 10 },
  subtitle: { color: '#675B51', marginTop: 8, lineHeight: 22, marginBottom: 16 },
  emptyCard: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#EDE2D0' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1B1714' },
  emptyText: { color: '#675B51', marginTop: 10, marginBottom: 16 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EDE2D0', marginBottom: 16 },
  image: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#eee', marginBottom: 12 },
  itemTitle: { fontSize: 20, fontWeight: '700', color: '#1B1714' },
  itemMeta: { color: '#675B51', marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryButton: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  removeButton: { flex: 1, backgroundColor: '#C79C59', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  removeButtonText: { color: '#fff', fontWeight: '700' },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  outlineButtonText: { color: '#111', fontWeight: '700' },
  summaryCard: { backgroundColor: '#FFF7E8', borderWidth: 1, borderColor: '#E5D2B0', borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryLabel: { color: '#8a6b2f', fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#111', marginTop: 8 },
  summaryText: { color: '#675B51', marginTop: 8, lineHeight: 20 },
});
