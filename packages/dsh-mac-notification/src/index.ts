/** Host registration for browser completion notifications. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { NOTIFICATIONS_SETTINGS_NAMESPACE, NotificationsSettingsSchema } from './notification-settings.ts'

export {
  COMPLETION_ENABLED_FIELD, NOTIFICATIONS_SETTINGS_NAMESPACE,
  type NotificationsSettings,
} from './notification-settings.ts'

/**
 * Register the durable notifications section when a settings provider exists.
 * @param ctx - Host context whose optional settings service owns the section.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(NOTIFICATIONS_SETTINGS_NAMESPACE),
      NotificationsSettingsSchema,
    )
  })
}
