/**
 * Package-owned invariant companion for `@djj45/dsh-mac-notification`.
 * @module @djj45/dsh-mac-notification/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@djj45/dsh-mac-notification'

/** Cordis companion plugin name. */
export const name = 'mac-notification-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: notification edges derive from the sessions list
 * snapshot (running→idle), whose state machine the runtime's manager
 * specs already cover, and the settings scope validates and publishes the
 * durable notifications section. The notifier's edge and policy behavior is
 * covered directly by this package's own specs.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
