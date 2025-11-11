import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUrlPosts() {
  console.log('Checking posts with URLs or empty content...\n')

  // Get all posts from Twitter source
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content, source, created_at, image_url')
    .eq('source', 'twitter')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  if (!posts || posts.length === 0) {
    console.log('No Twitter posts found.')
    return
  }

  console.log(`Found ${posts.length} recent Twitter posts:\n`)

  for (const post of posts) {
    const contentLength = post.content?.length || 0
    const isEmpty = contentLength === 0
    const isVeryShort = contentLength < 10

    console.log(`Post ID: ${post.id}`)
    console.log(`Created: ${new Date(post.created_at).toLocaleString('ja-JP')}`)
    console.log(`Content (${contentLength} chars): "${post.content}"`)
    console.log(`Has media: ${post.image_url ? 'Yes' : 'No'}`)
    if (isEmpty) {
      console.log('⚠️  WARNING: Empty content!')
    } else if (isVeryShort) {
      console.log('⚠️  WARNING: Very short content (might have had URL removed)')
    }
    console.log('---\n')
  }
}

checkUrlPosts().catch(console.error)