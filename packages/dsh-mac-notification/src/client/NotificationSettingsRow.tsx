/** General Settings row for the completion-notifications preference. */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NotificationPermissionState } from './completion-notifier.ts'
import css from './NotificationSettingsRow.module.css'

/** Registration-side preference face. */
export interface NotificationRowInjected {
  hooks: {
    /** Persisted completion-notifications preference bound as useEnabled. */
    enabled: SnapshotStore<boolean>
    /** Live browser notification permission bound as usePermission. */
    permission: SnapshotStore<NotificationPermissionState>
  }
  /** Enable notifications, requesting browser permission when it is undecided. */
  enable: () => Promise<void>
  /** Disable notifications (keeps the browser permission). */
  disable: () => void
}

/** Full Settings-row props. */
export type NotificationRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings.notifications'>
  & InjectFace<NotificationRowInjected>

/**
 * Render the completion-notifications preference row: switch plus a
 * permission-aware description (denied announcements carry the alert role).
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function NotificationSettingsRow({ useEnabled, usePermission, enable, disable, t }: NotificationRowProps) {
  const enabled = useEnabled(value => value)
  const permission = usePermission(value => value)
  const denied = permission === 'denied'
  const unsupported = permission === 'unsupported'
  const granted = permission === 'granted'
  const description = unsupported ? t('settings.unsupported')
    : denied ? t('settings.denied')
      : enabled && !granted ? t('settings.pending')
        : enabled ? t('settings.granted')
          : t('settings.description')

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('settings.title')}</div>
        <div className={css.desc} role={denied ? 'alert' : undefined}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t('settings.title')}
        className={css.switch}
        disabled={unsupported}
        onClick={() => {
          // An enabled preference without granted permission re-requests
          // instead of disabling; only the granted-on state toggles off.
          if (enabled && granted) {
            disable()
            return
          }
          void enable()
        }}
      >
        <span className={css.track} data-on={enabled || undefined} aria-hidden="true">
          <span className={css.thumb} />
        </span>
      </button>
    </div>
  )
}
