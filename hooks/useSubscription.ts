import { useEffect, useState } from 'react'
import { SubscriptionStatus } from '@/types/subscription'
import { supabase } from '@/lib/supabase'

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setLoading(true)

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const data = await response.json()
      setSubscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const isPro = subscription?.subscription.plan === 'pro'
  const isFree = subscription?.subscription.plan === 'free'
  const isAdmin = subscription?.isAdmin ?? false
  const canAccessProFeatures = isPro || isAdmin

  return {
    subscription,
    loading,
    error,
    isPro,
    isFree,
    isAdmin,
    canAccessProFeatures,
    refetch: fetchSubscription,
  }
}
