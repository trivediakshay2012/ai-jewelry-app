import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SummaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Design Summary</Text>

      <View style={styles.card}>
        <Text style={styles.item}>Metal: 18K Rose Gold</Text>
        <Text style={styles.item}>Stone: Oval Diamond</Text>
        <Text style={styles.item}>Setting: Hidden Halo</Text>
        <Text style={styles.item}>Band Width: 2.2mm</Text>
        <Text style={styles.item}>Budget: $5,000</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/image-result')}>
        <Text style={styles.buttonText}>Generate Jewelry Image</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  item: {
    fontSize: 16,
    marginBottom: 10,
    color: '#222',
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});