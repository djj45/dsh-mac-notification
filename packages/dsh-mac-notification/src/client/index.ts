/**
 * Browser completion notifications: watches the sessions list for running→idle
 * edges and, while the page is hidden or unfocused, emits system notifications
 * for stopped sessions. The plugin also registers the feature's preference row
 * into the settings General section (a feature owns its settings surface).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the ctx.settingsScope Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { NotificationsSettings } from '../notification-settings.ts'
import { NOTIFICATIONS_SETTINGS_NAMESPACE } from '../notification-settings.ts'
import {
  browserNotificationEnvironment, CompletionNotifier,
  type NotificationPermissionState,
} from './completion-notifier.ts'
import { CompletionNotificationsPolicy } from './policy.ts'
import { NotificationSettingsRow, type NotificationRowInjected } from './NotificationSettingsRow.tsx'
import { en, NS, zh, type NotificationsKey } from './locales.ts'

export type { NotificationRowInjected, NotificationRowProps } from './NotificationSettingsRow.tsx'
export type { NotificationPermissionState } from './completion-notifier.ts'
export type { NotificationsKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The completion-notifications settings row's copy. */
    'settings.notifications': NotificationsKey
  }
}

/**
 * Required services: the sessions feed, slots/locale for the preference row,
 * and the settings scope for the durable preference.
 */
export const inject = ['sessions', 'slots', 'locale', 'settingsScope']

/**
 * Client plugin body: watch session completion edges and register the
 * completion-notifications preference row into the General section.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const sessions = ctx.sessions
  const environment = browserNotificationEnvironment()
  const host = ctx.settingsScope.bind<NotificationsSettings>({ namespace: NOTIFICATIONS_SETTINGS_NAMESPACE })

  const policy = new CompletionNotificationsPolicy(environment, host)
  const t = ctx.locale.bind(NS)
  const notifier = new CompletionNotifier({
    t,
    environment,
    open: (id) => { sessions.open(id) },
  })

  // Watcher: any list or settings change re-syncs edges. Permission is read
  // per fire, so a browser-side revocation takes effect without a reload.
  const sync = (): void => {
    notifier.setEnabled(policy.enabled.getSnapshot())
    notifier.sync(sessions.list.getSnapshot())
  }
  ctx.effect(() => {
    const offList = sessions.list.subscribe(sync)
    const offSettings = host.subscribe(sync)
    sync()
    return () => {
      offList()
      offSettings()
    }
  }, 'ui-notifications: completion watch')

  // Live permission face for the settings row: browsers can change permission
  // outside the page (site settings), so refresh on focus and visibility.
  const permissionStore = createSnapshotStore<NotificationPermissionState>(environment.permission)
  const refreshPermission = (): void => { permissionStore.set(environment.permission) }
  ctx.effect(() => {
    window.addEventListener('focus', refreshPermission)
    document.addEventListener('visibilitychange', refreshPermission)
    return () => {
      window.removeEventListener('focus', refreshPermission)
      document.removeEventListener('visibilitychange', refreshPermission)
    }
  }, 'ui-notifications: permission refresh')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-notifications: dictionaries')

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'notifications',
    order: 30,
    locale: NS,
    inject: (): NotificationRowInjected => ({
      hooks: { enabled: policy.enabled, permission: permissionStore },
      enable: async () => {
        await policy.enable()
        refreshPermission()
      },
      disable: () => { policy.disable() },
    }),
  }, NotificationSettingsRow))
}
