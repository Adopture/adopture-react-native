import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Adopture } from '@adopture/react-native';

export default function ProfileScreen() {
  useEffect(() => {
    Adopture.screen('ProfileScreen');
  }, []);

  const show = (msg: string) => Alert.alert('Tracked', msg);

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>TU</Text>
      </View>
      <Text style={styles.name}>Test User</Text>
      <Text style={styles.subtitle}>test-user-001</Text>

      {/* Actions */}
      <View style={styles.list}>
        <ListItem
          label="Edit Profile"
          onPress={() => {
            Adopture.track('profile_edit_tapped');
            show('profile_edit_tapped');
          }}
        />
        <ListItem
          label="Change Avatar"
          onPress={() => {
            Adopture.track('avatar_change_tapped');
            show('avatar_change_tapped');
          }}
        />
        <ListItem
          label="Logout"
          onPress={() => {
            Adopture.track('logout_tapped');
            Adopture.reset();
            show('logout + reset');
          }}
        />
      </View>
    </View>
  );
}

function ListItem({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <Text style={styles.listItemText}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e', alignItems: 'center', paddingTop: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  subtitle: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  list: { width: '100%', marginTop: 32 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  listItemText: { color: '#d1d5db', fontSize: 16 },
  chevron: { color: '#6b7280', fontSize: 22 },
});
