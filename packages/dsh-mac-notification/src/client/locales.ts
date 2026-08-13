/** `settings.notifications` namespace dictionaries (the completion-notifications row's copy). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.notifications'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'settings.title': '任务完成系统通知',
  'settings.description': '在后台标签页或切到其他应用时，运行结束后通过系统通知提醒',
  'settings.granted': '已授权。页面不可见时，运行结束会弹出系统通知',
  'settings.pending': '已开启但浏览器尚未授权，点击开关请求通知权限',
  'settings.denied': '浏览器已拒绝通知权限，请在浏览器设置中允许本页通知后重试',
  'settings.unsupported': '当前环境不支持系统通知',
  'notification.completed': '任务已完成，点击回到 DeepSeek Harness',
  'notification.ended': '运行已结束，点击回到 DeepSeek Harness',
} satisfies Record<string, string>

/** The settings.notifications namespace key union. */
export type NotificationsKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'settings.title': 'System notifications for completions',
  'settings.description': 'Notify through the system when a run ends while this page is hidden or unfocused',
  'settings.granted': 'Allowed. Runs that end while the page is hidden pop a system notification',
  'settings.pending': 'Enabled, but the browser has not granted permission yet — click the switch to request it',
  'settings.denied': 'Notification permission is blocked by the browser; allow notifications for this site in browser settings and try again',
  'settings.unsupported': 'System notifications are not supported in this environment',
  'notification.completed': 'Task finished — click to return to DeepSeek Harness',
  'notification.ended': 'Run ended — click to return to DeepSeek Harness',
} satisfies Record<NotificationsKey, string>
