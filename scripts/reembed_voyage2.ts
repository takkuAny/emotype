// scripts/reembed_voyage2.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const VOYAGE_ENDPOINT = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-2' // 1024 次元

function normalize(v: number[]) {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0))
  return v.map(x => x / n)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 書き込み権限必須
)

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: texts })
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json() as { data: Array<{ embedding: number[] }> }
  return json.data.map(d => normalize(d.embedding))
}

async function main() {
  const BATCH = 50 // まとめて埋め込み（料金/制限に合わせ調整）
  let lastId: string | null = null
  let processed = 0

  while (true) {
    const q = supabase
      .from('posts')
      .select('id, content')
      .is('embedding_v2', null)
      .order('id', { ascending: true })
      .limit(BATCH)

    if (lastId) q.gt('id', lastId)

    const { data: rows, error } = await q
    if (error) throw error
    if (!rows || rows.length === 0) break

    const typedRows = rows as Array<{ id: string; content: string | null }>
    const embeddings = await embedBatch(typedRows.map(r => r.content ?? ''))
    const updates = typedRows.map((r, i) => ({
      id: r.id,
      embedding_v2: embeddings[i]
    }))

    const { error: upErr } = await supabase.from('posts').upsert(updates)
    if (upErr) throw upErr

    processed += typedRows.length
    lastId = typedRows[typedRows.length - 1].id
    console.log(`✅ updated ${processed}`)
    await new Promise(r => setTimeout(r, 250)) // 軽いスロットル
  }

  console.log('🎉 backfill done.')
}

main().catch(e => {
  console.error('❌', e)
  process.exit(1)
})
