/**
 * Completion-notifications preference policy: the live enabled bit plus the
 * permission-gated enable path. Direct persistence prefers the Host settings
 * document through the bound scope; a browser-local store keeps the toggle
 * durable when dsh's settings gateway does not expose the namespace (stock
 * rc.5/rc.6 answer `settings-not-exposed` to third-party namespaces). The
 * browser notification permission stays with the site (disabling the
 * preference never revokes it).
 */
import {
  createSnapshotStore, type SettingsScope, type SnapshotStore,
} from '@deepseek-ai/dsh-client-runtime/client'
import { COMPLETION_ENABLED_FIELD, type NotificationsSettings } from '../notification-settings.ts'
import type { NotificationEnvironment } from './completion-notifier.ts'

/**
 * Browser-local fallback key. Persisting here keeps the preference across
 * reloads when the Host settings write is refused by the settings gateway.
 */
const ENABLED_PERSIST_KEY = 'dsh-mac-notification.completion-enabled'

/** Live preference + permission-gated enable/disable for completion notifications. */
export class CompletionNotificationsPolicy {
  /**
   * Reactive preference source for the settings row. Persisted browser-local
   * as the fallback; when the Host scope publishes a readable section, its
   * value adopts over the local copy so the Host document stays authoritative.
   */
  readonly enabled: SnapshotStore<boolean> = createSnapshotStore(false, {
    persist: { name: ENABLED_PERSIST_KEY },
  })
  private readonly host: SettingsScope<NotificationsSettings> | undefined

  /**
   * @param environment - permission/request face.
   * @param host - durable preference scope owned by the providing plugin;
   * when absent or unexposed, the browser-local fallback keeps the
   * preference. The adoption subscription shares the scope's plugin lifetime,
   * so the policy needs no release hook.
   */
  constructor(
    private readonly environment: NotificationEnvironment,
    host?: SettingsScope<NotificationsSettings>,
  ) {
    this.host = host
    if (host !== undefined) {
      host.subscribe(() => { this.adopt(host) })
      this.adopt(host)
    }
  }

  /**
   * Enable the preference, requesting browser permission when it is still
   * undecided; the durable write happens only once the browser grants.
   * @returns whether notifications are enabled after the call.
   */
  async enable(): Promise<boolean> {
    let permission = this.environment.permission
    if (permission === 'unsupported') return false
    if (permission === 'default') permission = await this.environment.requestPermission()
    if (permission !== 'granted') return false
    this.enabled.set(true)
    void this.host?.set(COMPLETION_ENABLED_FIELD, true)
    return true
  }

  /** Turn the preference off; the browser permission stays with the site. */
  disable(): void {
    if (!this.enabled.getSnapshot()) return
    this.enabled.set(false)
    void this.host?.set(COMPLETION_ENABLED_FIELD, false)
  }

  /** Adopt the scope's accepted durable preference without writing it back. */
  private adopt(host: SettingsScope<NotificationsSettings>): void {
    const section = host.getSnapshot().value
    if (section === undefined || this.enabled.getSnapshot() === section.completionEnabled) return
    this.enabled.set(section.completionEnabled)
  }
}
