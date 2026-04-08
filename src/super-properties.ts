import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@adopture/super_props';

/**
 * Global event properties that persist across app sessions.
 * Super properties are automatically merged into every tracked event.
 * Event-level properties override super properties with the same key.
 */
export class SuperProperties {
  private props: Record<string, string> = {};

  /** Loads persisted super properties from storage. */
  async load(): Promise<void> {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json != null) {
      this.props = JSON.parse(json) as Record<string, string>;
    }
  }

  /** Registers super properties, overwriting any existing keys. */
  async register(properties: Record<string, string>): Promise<void> {
    Object.assign(this.props, properties);
    await this.persist();
  }

  /** Registers super properties only if the key is not already set. */
  async registerOnce(properties: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(properties)) {
      if (!(key in this.props)) {
        this.props[key] = value;
      }
    }
    await this.persist();
  }

  /** Removes a single super property by key. */
  async unregister(key: string): Promise<void> {
    delete this.props[key];
    await this.persist();
  }

  /** Clears all super properties. */
  async clear(): Promise<void> {
    this.props = {};
    await this.persist();
  }

  /** Returns a read-only copy of all current super properties. */
  get all(): Record<string, string> {
    return { ...this.props };
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.props));
  }
}
