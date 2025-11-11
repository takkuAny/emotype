export type SubscriptionPlan = 'free' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'
export type UserRole = 'user' | 'admin'

export interface UserSubscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  billing_cycle: BillingCycle | null
  contract_date: string | null
  plan_start_date: string | null
  plan_end_date: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  created_at: string
  updated_at: string
}

export interface UserRoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface SubscriptionStatus {
  subscription: {
    plan: SubscriptionPlan
    originalPlan?: SubscriptionPlan
    billingCycle: BillingCycle | null
    contractDate: string | null
    planStartDate: string | null
    planEndDate: string | null
    isActive: boolean
  }
  role: UserRole
  isAdmin: boolean
  limits: {
    remainingPosts: number
    monthlyPostCount: number
    monthlyLimit: number // -1 means unlimited
  }
}

export interface CanPostResponse {
  canPost: boolean
  remainingPosts: number
  plan: SubscriptionPlan
}

export interface UpdateSubscriptionRequest {
  userId: string
  plan: SubscriptionPlan
  billingCycle?: BillingCycle
  contractDate?: string
  planStartDate?: string
  planEndDate?: string
}

export interface UpdateRoleRequest {
  userId: string
  role: UserRole
}
