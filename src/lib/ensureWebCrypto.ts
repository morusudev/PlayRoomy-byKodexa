/**
 * Trystero needs crypto.subtle. It only exists in secure contexts
 * (https:// or http://localhost). On http://192.168.x.x it is missing.
 *
 * Soft check used by the UI gate — we do not polyfill AES-GCM here because
 * a custom polyfill would be incompatible with native subtle on HTTPS peers.
 */
export function isAppSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}
