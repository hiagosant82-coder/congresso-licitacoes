import { supabase } from './supabase'
import type { Json } from './database.types'

interface TrackOptions {
  action: string
  organization_id: string
  user_id?: string
  participant_id?: string
  details?: Record<string, unknown>
}

export async function trackEvent({ action, organization_id, user_id, participant_id, details = {} }: TrackOptions) {
  try {
    const enrichedDetails: Record<string, unknown> = {
      ...details,
      user_agent: navigator.userAgent?.slice(0, 500) ?? 'unknown',
      referrer: document.referrer || 'direct',
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    await supabase.from('activity_log').insert({
      organization_id,
      user_id: user_id ?? null,
      participant_id: participant_id ?? null,
      action,
      details: enrichedDetails as unknown as Json,
    })
  } catch {
    // silently fail tracking
  }
}

export async function trackLogin(userId: string, orgId: string) {
  await trackEvent({
    action: 'user_login',
    organization_id: orgId,
    user_id: userId,
    details: { method: 'email_password' },
  })
}

export async function trackLogout(userId: string, orgId: string) {
  await trackEvent({
    action: 'user_logout',
    organization_id: orgId,
    user_id: userId,
  })
}

export async function trackPageView(userId: string, orgId: string, page: string) {
  await trackEvent({
    action: 'page_view',
    organization_id: orgId,
    user_id: userId,
    details: { page },
  })
}

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string }
    _fbq?: unknown
  }
}

export function initMetaPixel() {
  if (!META_PIXEL_ID || typeof window === 'undefined' || window.fbq) return

  const n = window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod(...args) : n.queue?.push(args)
  } as NonNullable<Window['fbq']>
  n.queue = []
  n.loaded = true
  n.version = '2.0'
  window._fbq = n

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  const firstScript = document.getElementsByTagName('script')[0]
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript)
  }

  window.fbq('init', META_PIXEL_ID)
  window.fbq('track', 'PageView')
}

export function fireMetaEvent(eventName: string, params?: Record<string, unknown>) {
  try {
    window.fbq?.('track', eventName, params)
  } catch {
    // silently fail
  }
}

export function fireMetaPurchase(value: number, currency = 'BRL') {
  fireMetaEvent('Purchase', {
    value,
    currency,
  })
}
