import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Adopture } from '@adopture/react-native';

const PRODUCTS = [
  { name: 'Wireless Headphones', price: '79.99', category: 'electronics' },
  { name: 'Running Shoes', price: '129.00', category: 'sports' },
  { name: 'Coffee Beans 1kg', price: '24.50', category: 'food' },
  { name: 'React Native Book', price: '39.99', category: 'books' },
  { name: 'USB-C Hub', price: '49.99', category: 'electronics' },
];

export default function ShopScreen() {
  useEffect(() => {
    Adopture.screen('ShopScreen');
  }, []);

  const show = (msg: string) => Alert.alert('Tracked', msg);

  return (
    <View style={styles.container}>
      <FlatList
        data={PRODUCTS}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>
                ${item.price} · {item.category}
              </Text>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  Adopture.track('product_viewed', {
                    product: item.name,
                    price: item.price,
                    category: item.category,
                  });
                  show(`product_viewed (${item.name})`);
                }}
              >
                <Text style={styles.iconBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  Adopture.track('add_to_cart', {
                    product: item.name,
                    price: item.price,
                    category: item.category,
                  });
                  show(`add_to_cart (${item.name})`);
                }}
              >
                <Text style={styles.iconBtnText}>+ Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Checkout FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Adopture.track('checkout_started', {
            item_count: '3',
            total: '249.48',
          });
          show('checkout_started');
        }}
      >
        <Text style={styles.fabText}>Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  productName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  productMeta: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  productActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  iconBtnText: { color: '#d1d5db', fontSize: 11 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
