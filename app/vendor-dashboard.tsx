import { StyleSheet, Text, View } from 'react-native';

export default function VendorDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Dashboard</Text>
      <Text style={styles.text}>
        This screen will let jewelry vendors view requests, send quotes, and manage offers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
  },
});