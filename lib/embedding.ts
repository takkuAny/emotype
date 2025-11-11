// lib/embedding.ts
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    console.log('=== getEmbedding called ===')
    console.log('Provider:', process.env.EMBEDDING_PROVIDER)
    console.log('API Key exists:', !!process.env.VOYAGE_API_KEY)
    
    // Voyage AI縺ｮ豁｣縺励＞import
    const voyageai = await import("voyageai");
    console.log('VoyageAI module loaded')
    
    // VoyageAIClient 繧剃ｽｿ逕ｨ・医Ο繧ｰ縺九ｉ遒ｺ隱肴ｸ医∩・・
    const { VoyageAIClient } = voyageai;
    
    const client = new VoyageAIClient({ 
      apiKey: process.env.VOYAGE_API_KEY! 
    });
    
    console.log('Voyage client created')
    
    const resp = await client.embed({
      model: "voyage-3-lite",
      input: [text],
      inputType: "query",
    });
    
    if (!resp.data?.length) {
      throw new Error('Embedding response missing data')
    }

    const embeddingData = resp.data[0]
    if (!embeddingData) {
      throw new Error('Embedding response missing embedding')
    }

    if (!embeddingData.embedding) {
      throw new Error('Embedding vector missing in response')
    }

    console.log('Embedding generated successfully, dimension:', embeddingData.embedding.length)
    return embeddingData.embedding;
    
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown embedding error')
    console.error("=== Voyage embedding failed ===");
    console.error("Error:", err);
    console.error("Error message:", err.message);
    throw new Error(`Embedding generation failed: ${err.message}`);
  }
}
