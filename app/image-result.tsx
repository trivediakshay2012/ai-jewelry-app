import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ImageResultScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated Jewelry Design</Text>

      <View style={styles.imagePlaceholder}>
        <Text style={styles.placeholderText}>Jewelry image will appear here</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/saved-designs')}>
        <Text style={styles.buttonText}>Save / View Designs</Text>
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
  imagePlaceholder: {
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#f6f6f6',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
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