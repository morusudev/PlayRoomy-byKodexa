export const FULLSCREEN_CHAT_PREF_KEY = 'playroomy-fullscreen-chat'

export function readFullscreenChatPref(): boolean {
  try {
    return localStorage.getItem(FULLSCREEN_CHAT_PREF_KEY) !== 'false'
  } catch {
    return true
  }
}

export function storeFullscreenChatPref(enabled: boolean) {
  try {
    localStorage.setItem(FULLSCREEN_CHAT_PREF_KEY, enabled ? 'true' : 'false')
  } catch {
    // ignore
  }
}
