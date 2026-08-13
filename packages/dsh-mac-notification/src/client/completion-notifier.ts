/**
 * CompletionNotifier: derives running→idle session edges from the sessions
 * list snapshot and, while the page is hidden or unfocused, emits one system
 * notification per session that stopped. The visibility gate keeps the popup
 * for the case it exists for — the user left the page — while the in-page
 * sidebar reminder already covers an open page.
 */
import type {
  SessionId, SessionListState, SessionSummary,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { NotificationsKey } from './locales.ts'

/** Browser notification permission states, plus unsupported environments. */
export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

/** Emitted-notification handle: the platform activation surface. */
export interface NotificationHandle {
  /** Attach the activation handler (click opens the notified session). */
  onClick(handler: () => void): void
}

/** Platform environment the notifier and the preference row read. */
export interface NotificationEnvironment {
  /** Whether the page is hidden (other tab active, window minimized). */
  readonly hidden: boolean
  /** Whether the page holds focus. */
  readonly focused: boolean
  /** Current browser notification permission. */
  readonly permission: NotificationPermissionState
  /** Emit one system notification. */
  show(title: string, body: string, tag: string): NotificationHandle
  /** Ask the browser for permission (must run inside a user gesture). */
  requestPermission(): Promise<'granted' | 'denied' | 'default'>
}

/** Browser-backed environment: Notification API plus document visibility/focus. */
export function browserNotificationEnvironment(): NotificationEnvironment {
  return {
    get hidden(): boolean {
      return document.hidden
    },
    get focused(): boolean {
      return document.hasFocus()
    },
    get permission(): NotificationPermissionState {
      return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
    },
    show(title, body, tag) {
      const notification = new Notification(title, { body, tag, icon: '/favicon.svg' })
      return {
        onClick(handler) {
          notification.onclick = () => {
            window.focus()
            handler()
            notification.close()
          }
        },
      }
    },
    requestPermission() {
      return Notification.requestPermission()
    },
  }
}

/** One notification per session; a repeat completion replaces the earlier one. */
function notificationTag(sessionId: SessionId): string {
  return `dsh-completion-${sessionId}`
}

/** CompletionNotifier construction inputs. */
export interface CompletionNotifierOptions {
  /** Notification copy translator (reads the active locale at fire time). */
  t: (key: NotificationsKey) => string
  /** Open the notified session (notification activation). */
  open: (sessionId: SessionId) => void
  /** Platform environment; defaults to the browser Notification API. */
  environment?: NotificationEnvironment
}

/**
 * Session-list watcher for completion notifications. The first observation of
 * a session only records its running bit (a session already idle at load never
 * notifies); every later running→idle edge fires while the page is hidden or
 * unfocused, permission is granted, and the preference is enabled.
 */
export class CompletionNotifier {
  private enabled = false
  private readonly env: NotificationEnvironment
  private readonly prevRunning = new Map<SessionId, boolean>()

  /**
   * @param options - translator, session opener, and optional environment.
   */
  constructor(private readonly options: CompletionNotifierOptions) {
    this.env = options.environment ?? browserNotificationEnvironment()
  }

  /** Adopt the durable preference (read from the settings scope before each sync). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Diff the session list against the previous observation and notify on
   * running→idle edges. Sessions removed from the list are pruned, so a
   * re-added session seeds again instead of notifying on arrival.
   * @param snapshot - latest sessions list snapshot.
   */
  sync(snapshot: SessionListState): void {
    const seen = new Set<SessionId>()
    for (const [rawId, summary] of Object.entries(snapshot.byId)) {
      const id = rawId as SessionId
      seen.add(id)
      const prev = this.prevRunning.get(id)
      if (prev === undefined) {
        this.prevRunning.set(id, summary.running)
        continue
      }
      if (prev && !summary.running) this.notifyStopped(id, summary)
      this.prevRunning.set(id, summary.running)
    }
    for (const id of this.prevRunning.keys()) {
      if (!seen.has(id)) this.prevRunning.delete(id)
    }
  }

  /** One stopped session: apply the preference/permission/visibility gates, then emit. */
  private notifyStopped(id: SessionId, summary: SessionSummary): void {
    if (!this.enabled || this.env.permission !== 'granted') return
    if (!this.env.hidden && this.env.focused) return
    const bodyKey: NotificationsKey = summary.completed === true ? 'notification.completed' : 'notification.ended'
    const handle = this.env.show(summary.displayTitle, this.options.t(bodyKey), notificationTag(id))
    handle.onClick(() => { this.options.open(id) })
  }
}
