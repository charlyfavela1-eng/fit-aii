const CREDIT_KEY = 'fitaii_credits_v1'
const FREE_CREDITS = 1

export function getCredits(): number {
  if (typeof window === 'undefined') return 0
  const stored = localStorage.getItem(CREDIT_KEY)
  if (stored === null) {
    localStorage.setItem(CREDIT_KEY, String(FREE_CREDITS))
    return FREE_CREDITS
  }
  return parseInt(stored, 10)
}

export function useCredit(): boolean {
  const current = getCredits()
  if (current <= 0) return false
  localStorage.setItem(CREDIT_KEY, String(current - 1))
  return true
}

export function hasCredits(): boolean {
  return getCredits() > 0
}
