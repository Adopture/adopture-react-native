import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Adopture } from '@adopture/react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    Adopture.screen('SettingsScreen');
  }, []);

  return (
    <View style={styles.container}>
      {/* Toggle Settings */}
      <SettingRow
        label="Push Notifications"
        subtitle="Tracks: setting_changed"
        value={notifications}
        onToggle={(v) => {
          setNotifications(v);
          Adopture.track('setting_changed', {
            setting: 'notifications',
            value: String(v),
          });
        }}
      />
      <SettingRow
        label="Dark Mode"
        subtitle="Tracks: setting_changed"
        value={darkMode}
        onToggle={(v) => {
          setDarkMode(v);
          Adopture.track('setting_changed', {
            setting: 'dark_mode',
            value: String(v),
          });
        }}
      />

      <View style={styles.divider} />

      {/* Privacy Actions */}
      <TouchableOpacity
        style={styles.listItem}
        onPress={async () => {
          await Adopture.disable();
          forceUpdate((n) => n + 1);
          Alert.alert('Done', 'Analytics disabled. Queue cleared.');
        }}
      >
        <View>
          <Text style={styles.listItemText}>Opt-out of Analytics</Text>
          <Text style={styles.listItemSub}>Calls Adopture.disable()</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.listItem}
        onPress={() => {
          Adopture.enable();
          forceUpdate((n) => n + 1);
          Alert.alert('Done', 'Analytics re-enabled.');
        }}
      >
        <View>
          <Text style={styles.listItemText}>Opt back in</Text>
          <Text style={styles.listItemSub}>Calls Adopture.enable()</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* SDK Debug Info */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>SDK Debug Info</Text>
        <DebugRow label="Initialized" value={String(Adopture.isInitialized)} />
        <DebugRow label="Enabled" value={String(Adopture.isEnabled)} />
        <DebugRow label="Queue" value={String(Adopture.queueLength)} />
        <DebugRow
          label="Session"
          value={
            Adopture.sessionId
              ? Adopture.sessionId.substring(0, 20) + '...'
              : '-'
          }
        />
        <DebugRow label="Endpoint" value={Adopture.endpoint} />
      </View>
    </View>
  );
}

function SettingRow({
  label,
  subtitle,
  value,
  onToggle,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: '#4f46e5' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.debugRow}>
      <Text style={styles.debugLabel}>{label}</Text>
      <Text style={styles.debugValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  settingLabel: { color: '#d1d5db', fontSize: 16 },
  settingSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  divider: { height: 12, backgroundColor: '#0f172a' },
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
  listItemSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  chevron: { color: '#6b7280', fontSize: 22 },
  debugSection: { padding: 20 },
  debugTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  debugRow: { flexDirection: 'row', paddingVertical: 3 },
  debugLabel: { width: 80, color: '#6b7280', fontSize: 12 },
  debugValue: { flex: 1, color: '#d1d5db', fontFamily: 'monospace', fontSize: 12 },
});
