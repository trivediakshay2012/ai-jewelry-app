import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDesign } from '../context/DesignContext';
import { createNotificationEvent } from '../lib/notificationEvents';
import { buildPaymentReturnUrls, createHostedCheckoutSession } from '../lib/stripeCheckout';
import { supabase } from '../lib/supabase';

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function CheckoutScreen() {
  const { cartItems } = useDesign();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [notes, setNotes] = useState('');
  const [payingNow, setPayingNow] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [cartItems]
  );
  const estimatedTax = useMemo(() => Number((subtotal * 0.06625).toFixed(2)), [subtotal]);
  const estimatedShipping = useMemo(() => (subtotal > 0 ? 45 : 0), [subtotal]);
  const total = useMemo(
    () => Number((subtotal + estimatedTax + estimatedShipping).toFixed(2)),
    [subtotal, estimatedTax, estimatedShipping]
  );

  const validateCheckout = () => {
    if (!cartItems.length) {
      showMessage('Cart is empty', 'Add products before proceeding to checkout.');
      return false;
    }

    if (
      !name.trim() ||
      !email.trim() ||
      !address1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !postalCode.trim()
    ) {
      showMessage('Missing details', 'Please complete your contact and shipping details.');
      return false;
    }

    return true;
  };

  const payWithStripe = async () => {
    try {
      if (!validateCheckout()) return;

      setPayingNow(true);
      setStatusMessage('Creating checkout request...');

      const orderNumber = `CHK-${String(Date.now()).slice(-8)}`;

      const paymentRequestPayload = {
        lead_id: null,
        order_number: orderNumber,
        payment_type: 'full',
        amount: total,
        currency: 'usd',
        memo: notes.trim() || 'Checkout payment',
        status: 'requested',
        customer_name: name.trim(),
        customer_email: email.trim().toLowerCase(),
        design_title: cartItems[0]?.title || 'Jewelry order',
        shipping_name: name.trim(),
        shipping_email: email.trim().toLowerCase(),
        shipping_phone: phone.trim() || null,
        shipping_address_line1: address1.trim(),
        shipping_address_line2: address2.trim() || null,
        shipping_city: city.trim(),
        shipping_state: state.trim(),
        shipping_postal_code: postalCode.trim(),
        shipping_country: country.trim(),
        created_at: new Date().toISOString(),
      };

      const paymentRequestResult = await supabase
        .from('payment_requests')
        .insert([paymentRequestPayload])
        .select('*')
        .single();

      let paymentId = '';

      if (!paymentRequestResult.error && paymentRequestResult.data?.id) {
        paymentId = paymentRequestResult.data.id;
      } else {
        const paymentsFallbackPayload = {
          lead_id: null,
          order_number: orderNumber,
          payment_type: 'full',
          amount: total,
          currency: 'usd',
          status: 'requested',
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          created_at: new Date().toISOString(),
        };

        const paymentFallbackResult = await supabase
          .from('payments')
          .insert([paymentsFallbackPayload])
          .select('*')
          .single();

        if (paymentFallbackResult.error || !paymentFallbackResult.data?.id) {
          throw paymentFallbackResult.error || new Error('Payment request could not be created.');
        }

        paymentId = paymentFallbackResult.data.id;
      }

      await createNotificationEvent({
        audience: 'customer',
        title: 'Checkout started',
        body: `Order ${orderNumber} was created for $${total.toFixed(2)} and is ready for payment.`,
        recipientEmail: email.trim().toLowerCase(),
        referenceType: 'payment_request',
        referenceId: paymentId,
        metadata: { orderNumber, total },
      }).catch((error) => console.log('checkout notification skipped', error));

      const { successUrl, cancelUrl } = buildPaymentReturnUrls(null);

      setStatusMessage('Opening secure Stripe checkout...');

      const session = await createHostedCheckoutSession({
        paymentRequestId: paymentId,
        leadId: null,
        orderNumber,
        paymentType: 'full',
        amount: total,
        currency: 'usd',
        customerEmail: email.trim().toLowerCase(),
        customerName: name.trim(),
        designTitle: cartItems[0]?.title || 'Jewelry order',
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe checkout URL was not returned.');
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.assign(session.url);
        return;
      }

      const canOpen = await Linking.canOpenURL(session.url);
      if (!canOpen) {
        throw new Error('Stripe checkout URL could not be opened on this device.');
      }

      await Linking.openURL(session.url);
      setStatusMessage('Stripe checkout opened successfully. Complete payment and return to the app.');
    } catch (error: any) {
      setStatusMessage('Stripe checkout could not be opened.');
      showMessage(
        'Stripe checkout issue',
        error?.message || 'Could not open Stripe checkout. Check your function deployment and secrets.'
      );
    } finally {
      setPayingNow(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.subtitle}>
        Complete your shipping details and continue to Stripe checkout.
      </Text>
      {!!statusMessage ? <View style={styles.statusBox}><Text style={styles.statusText}>{statusMessage}</Text></View> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        {cartItems.length === 0 ? (
          <Text style={styles.muted}>Your cart is empty.</Text>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>{item.vendorName}</Text>
                <Text style={styles.itemMeta}>
                  {item.currency} {Number(item.price || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated tax</Text>
            <Text style={styles.totalValue}>${estimatedTax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated shipping</Text>
            <Text style={styles.totalValue}>${estimatedShipping.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowStrong]}>
            <Text style={styles.totalLabelStrong}>Total</Text>
            <Text style={styles.totalValueStrong}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact & Shipping</Text>
        <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Address line 1" value={address1} onChangeText={setAddress1} />
        <TextInput style={styles.input} placeholder="Address line 2" value={address2} onChangeText={setAddress2} />
        <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
        <TextInput style={styles.input} placeholder="State / Province" value={state} onChangeText={setState} />
        <TextInput style={styles.input} placeholder="Postal code" value={postalCode} onChangeText={setPostalCode} />
        <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Order notes"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, payingNow && styles.buttonDisabled]}
        onPress={payWithStripe}
        disabled={payingNow}
      >
        <Text style={styles.primaryButtonText}>{payingNow ? 'Opening Stripe...' : 'Proceed to Secure Checkout'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f2ec' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#1f1208' },
  subtitle: { fontSize: 15, color: '#5d4835', lineHeight: 22 },
  statusBox: { backgroundColor: '#ECFDF3', borderWidth: 1, borderColor: '#ABEFC6', borderRadius: 14, padding: 14 },
  statusText: { color: '#067647', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1f1208' },
  itemRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 62, height: 62, borderRadius: 12, backgroundColor: '#eee' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#1f1208' },
  itemMeta: { color: '#6b5a4a', marginTop: 2 },
  totalsBox: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRowStrong: { marginTop: 4 },
  totalLabel: { color: '#6b5a4a' },
  totalValue: { color: '#1f1208', fontWeight: '600' },
  totalLabelStrong: { color: '#1f1208', fontWeight: '800' },
  totalValueStrong: { color: '#1f1208', fontWeight: '800' },
  muted: { color: '#7a6754' },
  input: {
    borderWidth: 1,
    borderColor: '#e5d9ca',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  multiline: { minHeight: 110 },
  primaryButton: { backgroundColor: '#1c130c', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderColor: '#1c130c', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#1c130c', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.7 },
});
