import { StyleSheet, Text, View } from 'react-native';

export default function SavedDesignsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Designs</Text>
      <Text style={styles.text}>
        This screen will show all saved jewelry designs from Supabase.
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