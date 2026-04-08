import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Adopture } from '@adopture/react-native';

export default function StressTestScreen() {
  const [isSending, setIsSending] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    Adopture.screen('StressTestScreen');
  }, []);

  const showResult = (msg: string) =>
    Alert.alert('Result', msg, [{ text: 'OK' }]);

  async function burst(count: number) {
    for (let i = 0; i < count; i++) {
      Adopture.track('stress_event', {
        index: String(i),
        total: String(count),
        batch: String(Date.now()),
      });
    }
    forceUpdate((n) => n + 1);
    showResult(`Sent ${count} events. Queue: ${Adopture.queueLength}`);
  }

  async function testOptOutCycle() {
    // 1. Disable
    await Adopture.disable();
    const queueAfterDisable = Adopture.queueLength;

    // 2. Try to track (should be silently dropped)
    Adopture.track('should_be_dropped', { phase: 'disabled' });
    const queueAfterDropped = Adopture.queueLength;

    // 3. Re-enable
    Adopture.enable();

    // 4. Track for real
    Adopture.track('after_reenable', { phase: 'enabled' });
    const queueAfterEnable = Adopture.queueLength;

    forceUpdate((n) => n + 1);
    showResult(
      `Opt-out cycle complete:\n` +
        `  After disable: queue=${queueAfterDisable}\n` +
        `  After dropped track: queue=${queueAfterDropped} (should be same)\n` +
        `  After re-enable track: queue=${queueAfterEnable} (should be +1)`,
    );
  }

  const ctx = Adopture.deviceContext;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
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
        {ctx && (
          <Text style={styles.deviceInfo}>
            {ctx.os} {ctx.os_version} · {ctx.device_type} · {ctx.screen_width}x
            {ctx.screen_height}
          </Text>
        )}
      </View>

      {/* Test Cards */}
      <TestCard
        title="Burst: 10 Events"
        description="Send 10 track events rapidly to test batching."
        onRun={() => burst(10)}
      />
      <TestCard
        title="Burst: 50 Events"
        description="Send 50 events to test queue + flush threshold."
        onRun={() => burst(50)}
      />
      <TestCard
        title="Burst: 200 Events"
        description="Send 200 events to test multi-batch sending (max 100/request)."
        onRun={() => burst(200)}
      />
      <TestCard
        title="Manual Flush"
        description="Force flush all queued events to the server now."
        onRun={async () => {
          setIsSending(true);
          await Adopture.flush();
          setIsSending(false);
          forceUpdate((n) => n + 1);
          showResult(`Flushed. Queue: ${Adopture.queueLength}`);
        }}
      />
      <TestCard
        title="Opt-out / Opt-in Cycle"
        description="Disable tracking, try to track events (should be dropped), re-enable, track again, verify only post-enable events are queued."
        onRun={testOptOutCycle}
      />
      <TestCard
        title="Reset SDK State"
        description="Clears queue, user ID, starts new session. Verify session ID changes."
        onRun={async () => {
          const oldSession = Adopture.sessionId;
          await Adopture.reset();
          const newSession = Adopture.sessionId;
          forceUpdate((n) => n + 1);
          showResult(
            `Session rotated\n` +
              `Old: ${oldSession?.substring(0, 8)}...\n` +
              `New: ${newSession?.substring(0, 8)}...\n` +
              `Queue: ${Adopture.queueLength}`,
          );
        }}
      />
      <TestCard
        title="Large Properties"
        description="Track event with many properties (near 500-char limit per value)."
        onRun={() => {
          const props: Record<string, string> = {};
          for (let i = 0; i < 10; i++) {
            props[`key_${i}`] = 'v'.repeat(100);
          }
          Adopture.track('large_props_event', props);
          forceUpdate((n) => n + 1);
          showResult(
            `Tracked large_props_event with 10 properties.\nQueue: ${Adopture.queueLength}`,
          );
        }}
      />
      <TestCard
        title="Rapid Screen Views"
        description="Fire 20 screen() calls to simulate fast navigation."
        onRun={() => {
          const screens = [
            'Home', 'Profile', 'Settings', 'Shop', 'Cart',
            'Checkout', 'OrderConfirm', 'Search', 'Filters', 'Detail',
            'Reviews', 'Wishlist', 'Notifications', 'Messages', 'Help',
            'About', 'Terms', 'Privacy', 'Account', 'Billing',
          ];
          for (const s of screens) {
            Adopture.screen(s);
          }
          forceUpdate((n) => n + 1);
          showResult(`Fired 20 screen views.\nQueue: ${Adopture.queueLength}`);
        }}
      />

      {isSending && (
        <View style={{ alignItems: 'center', padding: 16 }}>
          <ActivityIndicator color="#6366f1" />
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function TestCard({
  title,
  description,
  onRun,
}: {
  title: string;
  description: string;
  onRun: () => void;
}) {
  return (
    <View style={styles.testCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.testTitle}>{title}</Text>
        <Text style={styles.testDesc}>{description}</Text>
      </View>
      <TouchableOpacity style={styles.runBtn} onPress={onRun}>
        <Text style={styles.runBtnText}>Run</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  mono: { color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' },
  deviceInfo: { color: '#6b7280', fontSize: 11, marginTop: 8 },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  testTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  testDesc: { color: '#6b7280', fontSize: 11, marginTop: 4 },
  runBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  runBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
