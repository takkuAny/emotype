import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpecificPost() {
  // Check posts table
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .ilike('content', '%会場にチェックインしました%')
    .single()

  console.log('=== Posts Table ===')
  if (postError) {
    console.error('Error:', postError)
  } else {
    console.log(JSON.stringify(post, null, 2))
  }

  // Check twitter_posts table for matching text
  const { data: twitterPosts, error: twitterError } = await supabase
    .from('twitter_posts')
    .select('*')
    .ilike('text', '%会場にチェックインしました%')

  console.log('\n=== Twitter_Posts Table ===')
  if (twitterError) {
    console.error('Error:', twitterError)
  } else {
    console.log(JSON.stringify(twitterPosts, null, 2))
  }
}

checkSpecificPost().catch(console.error)