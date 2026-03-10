import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Jewelry App</Text>
      <Text style={styles.subtitle}>
        Design custom jewelry with AI, see it before it is made, and connect with vendors.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/chat')}>
        <Text style={styles.buttonText}>Start Designing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/saved-designs')}
      >
        <Text style={styles.secondaryButtonText}>View Saved Designs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/vendor-dashboard')}
      >
        <Text style={styles.secondaryButtonText}>Vendor Dashboard</Text>
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
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
});