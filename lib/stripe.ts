import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Please configure Stripe credentials in your environment.'
    )
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
    })
  }

  return stripeClient
}
