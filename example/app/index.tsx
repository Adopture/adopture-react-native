import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Adopture } from '@adopture/react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [, forceUpdate] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (Adopture.isInitialized) {
      Adopture.screen('HomeScreen');
    }
    // Refresh SDK state every second
    timerRef.current = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const log = useCallback((message: string) => {
    const now = new Date();
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setEventLog((prev) => [`${ts} ${message}`, ...prev].slice(0, 50));
  }, []);

  const ctx = Adopture.deviceContext;

  return (
    <View style={styles.container}>
      {/* SDK State Card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: Adopture.isEnabled ? '#4ade80' : '#ef4444' },
              ]}
            />
            <Text style={styles.statusText}>
              {Adopture.isEnabled ? 'TRACKING ON' : 'TRACKING OFF'}
            </Text>
          </View>
          <Text style={styles.mono}>Queue: {Adopture.queueLength}</Text>
        </View>
        <InfoRow label="Session" value={truncate(Adopture.sessionId, 20)} />
        <InfoRow label="Endpoint" value={Adopture.endpoint} />
        {ctx && (
          <>
            <InfoRow
              label="Device"
              value={`${ctx.os} ${ctx.os_version} · ${ctx.device_type}`}
            />
            <InfoRow
              label="App"
              value={`v${ctx.app_version || '?'} · ${ctx.locale}`}
            />
            <InfoRow
              label="Screen"
              value={`${ctx.screen_width}x${ctx.screen_height}`}
            />
          </>
        )}
      </View>

      {/* Navigation Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        <NavChip label="Profile" onPress={() => router.push('/profile')} />
        <NavChip label="Settings" onPress={() => router.push('/settings')} />
        <NavChip label="Shop" onPress={() => router.push('/shop')} />
        <NavChip label="Revenue" onPress={() => router.push('/revenue')} />
        <NavChip label="Stress Test" onPress={() => router.push('/stress')} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <ActionButton
          label="Track Event"
          onPress={() => {
            Adopture.track('button_clicked', {
              screen: 'home',
              variant: 'primary',
            });
            log('track: button_clicked');
          }}
        />
        <ActionButton
          label="Flush"
          onPress={async () => {
            await Adopture.flush();
            log('flush: manual');
          }}
        />
        <ActionButton
          label="Reset"
          color="#f97316"
          onPress={async () => {
            await Adopture.reset();
            log('reset: cleared queue + new session');
          }}
        />
        <ActionButton
          label={Adopture.isEnabled ? 'Disable' : 'Enable'}
          color={Adopture.isEnabled ? '#ef4444' : '#22c55e'}
          onPress={async () => {
            if (Adopture.isEnabled) {
              await Adopture.disable();
              log('tracking: DISABLED (opt-out)');
            } else {
              Adopture.enable();
              log('tracking: ENABLED');
            }
          }}
        />
      </View>

      {/* Event Log */}
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>Event Log</Text>
        <TouchableOpacity onPress={() => setEventLog([])}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={eventLog}
        keyExtractor={(_, i) => String(i)}
        style={styles.logList}
        renderItem={({ item }) => (
          <Text style={styles.logItem}>{item}</Text>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyLog}>
            No events yet.{'\n'}Tap buttons or navigate screens.
          </Text>
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function NavChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, color ? { backgroundColor: color } : null]}
      onPress={onPress}
    >
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(s: string | undefined, max: number): string {
  if (!s) return '-';
  return s.length > max ? s.substring(0, max) + '...' : s;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  card: {
    margin: 12,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  mono: { color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', paddingVertical: 2 },
  infoLabel: { width: 70, color: '#6b7280', fontSize: 11 },
  infoValue: {
    flex: 1,
    color: '#d1d5db',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  chipScroll: { maxHeight: 48 },
  chipContainer: { paddingHorizontal: 12, gap: 8 },
  chip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipText: { color: '#d1d5db', fontSize: 13 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  logTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  clearButton: { color: '#6366f1', fontSize: 12 },
  logList: { flex: 1, paddingHorizontal: 12 },
  logItem: { color: '#9ca3af', fontFamily: 'monospace', fontSize: 11, paddingVertical: 1 },
  emptyLog: { color: '#6b7280', textAlign: 'center', marginTop: 40 },
});
