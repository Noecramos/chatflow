/**
 * Retrieval-Augmented Generation (RAG) Service
 * Provides chunking, vector similarity calculation, and keyword fallback matching.
 */

// Cosine similarity in pure Javascript
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple sliding window chunker
function chunkText(text, size = 600, overlap = 100) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const word of words) {
    currentChunk.push(word);
    currentLength += word.length + 1; // plus space

    if (currentLength >= size) {
      chunks.push(currentChunk.join(' '));
      // sliding overlap
      const overlapWordsCount = Math.floor(currentChunk.length * (overlap / size));
      currentChunk = currentChunk.slice(currentChunk.length - overlapWordsCount);
      currentLength = currentChunk.join(' ').length;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  return chunks;
}

// Lightweight TF-IDF Keyword Matcher fallback for zero-dependency operation
function getKeywordMatches(chunks, query, topK = 3) {
  if (!chunks || chunks.length === 0) return [];
  
  const queryTokens = query.toLowerCase().match(/\b\w+\b/g) || [];
  if (queryTokens.length === 0) return chunks.slice(0, topK);

  const scoredChunks = chunks.map(chunk => {
    const chunkText = chunk.content.toLowerCase();
    let score = 0;
    
    queryTokens.forEach(token => {
      // Calculate token occurrences in chunk (simple TF)
      const matches = chunkText.split(token).length - 1;
      if (matches > 0) {
        // Boost score if exact term matches
        score += matches;
      }
    });

    return { chunk, score };
  });

  // Sort by score descending and return top K
  return scoredChunks
    .filter(sc => sc.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(sc => sc.chunk)
    .slice(0, topK);
}

module.exports = {
  cosineSimilarity,
  chunkText,
  getKeywordMatches,
  
  /**
   * Search for context chunks matching the query.
   * Uses high-performance Cosine Similarity if vectors are available;
   * falls back to TF-IDF keyword search automatically if embeddings are absent.
   */
  async searchKnowledge(prisma, botId, query, queryEmbeddingVector = null, topK = 3) {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { botId }
    });

    if (chunks.length === 0) return [];

    // If query embedding is provided, perform semantic vector similarity search
    if (queryEmbeddingVector && queryEmbeddingVector.length > 0) {
      try {
        const scored = chunks.map(chunk => {
          let vector;
          try {
            vector = typeof chunk.embedding === 'string' ? JSON.parse(chunk.embedding) : chunk.embedding;
          } catch (e) {
            return { chunk, score: 0 };
          }
          
          if (!Array.isArray(vector) || vector.length === 0) {
            return { chunk, score: 0 };
          }

          const score = cosineSimilarity(queryEmbeddingVector, vector);
          return { chunk, score };
        });

        // Filter and sort
        const topChunks = scored
          .filter(s => s.score > 0.4) // Threshold similarity score
          .sort((a, b) => b.score - a.score)
          .map(s => s.chunk)
          .slice(0, topK);

        if (topChunks.length > 0) return topChunks;
      } catch (err) {
        console.error("Cosine Similarity calculation error, falling back to keywords:", err);
      }
    }

    // Fallback: Robust local keyword matching
    return getKeywordMatches(chunks, query, topK);
  }
};
