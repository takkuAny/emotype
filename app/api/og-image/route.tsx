import { NextRequest } from 'next/server'
import satori from 'satori'

export const runtime = 'edge'

// 感情ラベルの日本語マッピング
const emotionLabels: Record<string, string> = {
  joy: '喜び',
  sadness: '悲しみ',
  anger: '怒り',
  fear: '不安',
  surprise: '驚き',
  love: '愛',
  neutral: '平穏',
}

let cachedFontData: ArrayBuffer | null = null

const loadFontData = async () => {
  if (cachedFontData) {
    return cachedFontData
  }

  const fontUrl = new URL('./fonts/NotoSansJP-Regular.otf', import.meta.url)
  const fontResponse = await fetch(fontUrl)

  if (!fontResponse.ok) {
    throw new Error('Failed to load font for OG image')
  }

  cachedFontData = await fontResponse.arrayBuffer()
  return cachedFontData
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const totalPosts = searchParams.get('totalPosts') || '0'
    const emotion1 = searchParams.get('emotion1') || ''
    const count1 = searchParams.get('count1') || '0'
    const emotion2 = searchParams.get('emotion2') || ''
    const count2 = searchParams.get('count2') || '0'
    const emotion3 = searchParams.get('emotion3') || ''
    const count3 = searchParams.get('count3') || '0'

    const fontData = await loadFontData()

    const svg = await satori(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '60px',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              marginRight: '20px',
            }}
          >
            📊
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            週次感情レポート
          </div>
        </div>

        {/* メインコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '30px',
            padding: '50px 60px',
            width: '90%',
            maxWidth: '900px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* 投稿数 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              paddingBottom: '30px',
              borderBottom: '2px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                color: '#6b7280',
                marginRight: '20px',
              }}
            >
              今週の記録数
            </div>
            <div
              style={{
                fontSize: '80px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {totalPosts}
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#6b7280',
                marginLeft: '10px',
              }}
            >
              件
            </div>
          </div>

          {/* トップ3感情 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: '#6b7280',
                marginBottom: '10px',
              }}
            >
              よく感じた感情 TOP3
            </div>

            {emotion1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '15px',
                  padding: '20px 30px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '40px',
                      marginRight: '20px',
                    }}
                  >
                    🥇
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                    }}
                  >
                    {emotionLabels[emotion1] || emotion1}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#667eea',
                  }}
                >
                  {count1}回
                </div>
              </div>
            )}

            {emotion2 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f9fafb',
                  borderRadius: '15px',
                  padding: '20px 30px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '40px',
                      marginRight: '20px',
                    }}
                  >
                    🥈
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                    }}
                  >
                    {emotionLabels[emotion2] || emotion2}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#764ba2',
                  }}
                >
                  {count2}回
                </div>
              </div>
            )}

            {emotion3 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f9fafb',
                  borderRadius: '15px',
                  padding: '20px 30px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '40px',
                      marginRight: '20px',
                    }}
                  >
                    🥉
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                    }}
                  >
                    {emotionLabels[emotion3] || emotion3}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#9333ea',
                  }}
                >
                  {count3}回
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            Emotype
          </div>
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginLeft: '15px',
            }}
          >
            - Your Social-Mood Coach
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'NotoSansJP',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    )

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
