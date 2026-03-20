import { Stack } from 'expo-router';
import { AuthRoleProvider } from '../components/AuthRoleContext';
import { DesignProvider } from '../context/DesignContext';

export default function RootLayout() {
  return (
    <AuthRoleProvider>
      <DesignProvider>
        <Stack screenOptions={{ headerTitleAlign: 'center' }}>
          <Stack.Screen name="index" options={{ title: 'Aurra' }} />
          <Stack.Screen name="chat" options={{ title: 'Design Chat' }} />
          <Stack.Screen name="summary" options={{ title: 'Design Summary' }} />
          <Stack.Screen name="image-result" options={{ title: 'Generated Design' }} />
          <Stack.Screen name="saved-designs" options={{ title: 'Saved Designs' }} />
          <Stack.Screen name="vendor-signup" options={{ title: 'Vendor Sign Up' }} />
          <Stack.Screen name="vendor-login" options={{ title: 'Vendor Log In' }} />
          <Stack.Screen name="vendor-dashboard" options={{ title: 'Vendor Dashboard' }} />
          <Stack.Screen name="vendor-catalog" options={{ title: 'Vendor Catalog' }} />
          <Stack.Screen name="vendor-inventory" options={{ title: 'Manage Inventory' }} />
          <Stack.Screen name="vendor-orders" options={{ title: 'Vendor Orders' }} />
          <Stack.Screen name="admin-login" options={{ title: 'Admin Login' }} />
          <Stack.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="notifications-center" options={{ title: 'Notifications' }} />
          <Stack.Screen name="payment-center" options={{ title: 'Payment Center' }} />
          <Stack.Screen name="my-quotes" options={{ title: 'My Quotes' }} />
          <Stack.Screen name="cart" options={{ title: 'Cart' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="request-quote" options={{ title: 'Request Quote' }} />
          <Stack.Screen name="invite/[vendor]" options={{ title: 'Jeweler Invite' }} />
          <Stack.Screen name="vendor-leads/[leadId]" options={{ title: 'Lead Details' }} />
          <Stack.Screen name="vendor-quotes/create" options={{ title: 'Create Quote' }} />
        </Stack>
      </DesignProvider>
    </AuthRoleProvider>
  );
}
