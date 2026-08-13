/** Completion-notification preference stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'

/** Settings namespace owned by the notifications plugin. */
export const NOTIFICATIONS_SETTINGS_NAMESPACE = 'ui-notifications'

/** Field carrying whether completion notifications are enabled. */
export const COMPLETION_ENABLED_FIELD = 'completionEnabled'

/** Durable notifications section shared by the Host schema and the browser scope. */
export interface NotificationsSettings {
  /** Emit a system notification when a running session stops while the page is hidden or unfocused. */
  completionEnabled: boolean
}

/** Durable notifications schema; also the wire envelope the browser scope validates against. */
export const NotificationsSettingsSchema: z<NotificationsSettings> = z.object({
  [COMPLETION_ENABLED_FIELD]: z.boolean().default(false),
})
