import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Adopture } from '@adopture/react-native';
import type { RevenueData } from '@adopture/react-native';

export default function RevenueScreen() {
  useEffect(() => {
    Adopture.screen('RevenueDemoScreen');
  }, []);

  const show = (msg: string) => Alert.alert('Tracked', msg);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Test revenue tracking methods</Text>

      <RevenueButton
        label="Track Purchase"
        color="#4f46e5"
        onPress={() => {
          Adopture.trackPurchase({
            productId: 'com.example.premium_monthly',
            price: 9.99,
            currency: 'USD',
            transactionId: `txn_${Date.now()}`,
          });
          show('purchase $9.99 USD');
        }}
      />

      <RevenueButton
        label="Track One-Time Purchase"
        color="#4f46e5"
        onPress={() => {
          Adopture.trackOneTimePurchase({
            productId: 'com.example.lifetime_access',
            price: 49.99,
            currency: 'USD',
            transactionId: `txn_${Date.now()}`,
          });
          show('one-time purchase $49.99 USD');
        }}
      />

      <RevenueButton
        label="Track Renewal"
        color="#4f46e5"
        onPress={() => {
          Adopture.trackRenewal({
            productId: 'com.example.premium_monthly',
            price: 9.99,
            currency: 'USD',
            transactionId: `txn_${Date.now()}`,
          });
          show('renewal $9.99 USD');
        }}
      />

      <RevenueButton
        label="Track Trial Started"
        color="#4f46e5"
        onPress={() => {
          const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          Adopture.trackTrialStarted({
            productId: 'com.example.premium_monthly',
            expirationAt: exp.toISOString().split('.')[0] + 'Z',
          });
          show('trial started (7 days)');
        }}
      />

      <RevenueButton
        label="Track Trial Converted"
        color="#22c55e"
        onPress={() => {
          Adopture.trackTrialConverted({
            productId: 'com.example.premium_monthly',
            price: 9.99,
            currency: 'USD',
            transactionId: `txn_${Date.now()}`,
          });
          show('trial converted $9.99 USD');
        }}
      />

      <RevenueButton
        label="Track Cancellation"
        color="#f97316"
        onPress={() => {
          Adopture.trackCancellation({
            productId: 'com.example.premium_monthly',
          });
          show('cancellation');
        }}
      />

      <RevenueButton
        label="Track Refund"
        color="#ef4444"
        onPress={() => {
          Adopture.trackRefund({
            productId: 'com.example.premium_monthly',
            price: 9.99,
            currency: 'USD',
            transactionId: `txn_${Date.now()}`,
          });
          show('refund $9.99 USD');
        }}
      />

      <RevenueButton
        label="Track Custom Revenue"
        color="#4f46e5"
        onPress={() => {
          const revenue: RevenueData = {
            event_type: 'NON_RENEWING_PURCHASE',
            product_id: 'com.example.coin_pack_500',
            price: 4.99,
            currency: 'EUR',
            quantity: 2,
            store: 'APP_STORE',
          };
          Adopture.trackRevenue(revenue);
          show('custom revenue 2x 4.99 EUR');
        }}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function RevenueButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  heading: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
