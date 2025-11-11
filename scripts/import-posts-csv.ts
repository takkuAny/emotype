// import-posts-csv.ts
// CSV繝輔ぃ繧､繝ｫ縺九ｉposts繝・・繧ｿ繧偵う繝ｳ繝昴・繝医☆繧九せ繧ｯ繝ｪ繝励ヨ

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 迺ｰ蠅・､画焚繧定ｪｭ縺ｿ霎ｼ繧・・env.local繝輔ぃ繧､繝ｫ縺九ｉ・・
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // 繧ｯ繧ｩ繝ｼ繝医ｒ蜑企勁
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type PostInsertRow = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  emotion_tag: string | null;
  source: string | null;
  embedding: number[] | null;
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 繧ｨ繧ｹ繧ｱ繝ｼ繝励＆繧後◆蠑慕畑隨ｦ
        current += '"';
        i++; // 谺｡縺ｮ譁・ｭ励ｒ繧ｹ繧ｭ繝・・
      } else {
        // 蠑慕畑隨ｦ縺ｮ髢句ｧ・邨ゆｺ・
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 繝輔ぅ繝ｼ繝ｫ繝峨・蛹ｺ蛻・ｊ
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current); // 譛蠕後・繝輔ぅ繝ｼ繝ｫ繝・

  return result;
}

function parseEmbedding(embeddingStr: string | null): number[] | null {
  if (!embeddingStr || embeddingStr.trim() === '') return null;
  try {
    // JSON驟榊・縺ｨ縺励※繝代・繧ｹ
    const parsed = JSON.parse(embeddingStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function importCSV(csvPath: string) {
  console.log(`\n=== CSVインポート開始: ${csvPath} ===\n`);

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.error('CSVファイルが空です');
    return;
  }

  // 繝倥ャ繝繝ｼ陦後ｒ繧ｹ繧ｭ繝・・
  const headerLine = lines[0];
  const dataLines = lines.slice(1);

  console.log(`ヘッダー: ${headerLine}`);
  console.log(`レコード数: ${dataLines.length}\n`);

  const headers = parseCSVLine(headerLine);
  console.log(`列数: ${headers.length}`);
  console.log(`列名: ${headers.join(', ')}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const batchSize = 50; // 繝舌ャ繝√し繧､繧ｺ

  // 繝舌ャ繝∝・逅・
  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    const postsToInsert: PostInsertRow[] = []; 

    for (const line of batch) {
      try {
        const values = parseCSVLine(line);
        
        if (values.length < headers.length) {
          console.warn(`⚠️ 行${i + batch.indexOf(line) + 2} の列数が不足しています`);
          skipCount++;
          continue;
        }

        const row: Record<string, string | number[] | null | undefined> = {}; 
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || null;
          
          if (header === 'embedding') {
            row[header] = parseEmbedding(value);
          } else if (header === 'image_url' && (value === '' || value === 'null')) {
            row[header] = null;
          } else {
            row[header] = value;
          }
        });

        // 蠢・医ヵ繧｣繝ｼ繝ｫ繝峨・繝√ぉ繝・け
        const rowId = typeof row.id === "string" ? row.id : null;
        const rowContent = typeof row.content === "string" ? row.content : null;

        if (!rowId || !rowContent) {
          console.warn(`⚠️ 行${i + batch.indexOf(line) + 2}: 必須項目が欠けています`);
          skipCount++;
          continue;
        }

        postsToInsert.push({
          id: rowId,
          user_id:
            typeof row.user_id === "string"
              ? row.user_id
              : '00000000-0000-0000-0000-000000000000',
          content: rowContent,
          image_url: typeof row.image_url === "string" ? row.image_url : null,
          created_at:
            typeof row.created_at === "string" && row.created_at
              ? row.created_at
              : new Date().toISOString(),
          emotion_tag: typeof row.emotion_tag === "string" ? row.emotion_tag : null,
          source: typeof row.source === "string" && row.source ? row.source : 'manual',
          embedding: Array.isArray(row.embedding) ? row.embedding : null, // 既に配列としてパース済み
        });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ 行${i + batch.indexOf(line) + 2} のパースエラー: ${message}`);
        errorCount++;
      }
    }

    // 繝舌ャ繝√〒謖ｿ蜈･・・psert繧剃ｽｿ逕ｨ縺励※驥崎､・ｒ驕ｿ縺代ｋ・・
    if (postsToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from('posts')
          .upsert(postsToInsert, { onConflict: 'id' });

        if (error) {
          console.error(`❌ バッチ${Math.floor(i / batchSize) + 1} のアップサートでエラー:`, error.message);
          errorCount += postsToInsert.length;
        } else {
          successCount += postsToInsert.length;
          console.log(`✅ バッチ${Math.floor(i / batchSize) + 1}: ${postsToInsert.length}件をインポートしました`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ バッチ処理でエラー:', message);
        errorCount += postsToInsert.length;
      }

      // 繝ｬ繝ｼ繝亥宛髯仙ｯｾ遲悶〒蟆代＠蠕・ｩ・
      if (i + batchSize < dataLines.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('=== インポート結果 ===');
  console.log(`   - 成功: ${successCount}件`);
  console.log(`   - スキップ: ${skipCount}件`);
  console.log(`   - エラー: ${errorCount}件`);
  console.log(`   - 合計: ${dataLines.length}件`);
}

// 繝｡繧､繝ｳ蜃ｦ逅・
const csvPath = process.argv[2] || path.join(__dirname, '../../Downloads/posts_rows.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`CSVファイルが見つかりません: ${csvPath}`);
  console.log('\n実行例:');
  console.log('  tsx scripts/import-posts-csv.ts <CSVファイルのパス>');
  console.log('\n例:');
  console.log('  tsx scripts/import-posts-csv.ts "c:\\Users\\takas\\Downloads\\posts_rows.csv"');
  process.exit(1);
}

importCSV(csvPath).catch((error) => {
  console.error('❌ インポート処理でエラー:', error);
  process.exit(1);
});


