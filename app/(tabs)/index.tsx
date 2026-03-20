import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aurra</Text>
      <Text style={styles.subtitle}>
        Home tab temporarily simplified so the web build can complete.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
  },
});