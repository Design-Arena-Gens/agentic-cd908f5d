import crypto from "crypto";
import { VectorEmbedding, VectorQueryResult, WorkspaceDocument } from "./types";

const VECTOR_SIZE = 384;

const tokenRegex = /[A-Za-z0-9_]+/g;

function hashToken(token: string) {
  const hash = crypto.createHash("sha1").update(token).digest();
  return hash[0]! ^ hash[hash.length - 1]!;
}

function tokenize(content: string) {
  const tokens = content.toLowerCase().match(tokenRegex);
  if (!tokens) {
    return [];
  }
  return tokens.filter((token) => token.length > 1);
}

function buildVector(tokens: string[]) {
  const vector = new Float32Array(VECTOR_SIZE);
  for (const token of tokens) {
    const idx = hashToken(token) % VECTOR_SIZE;
    vector[idx] += 1;
  }

  let norm = 0;
  for (const value of vector) {
    norm += value * value;
  }
  norm = Math.sqrt(norm);

  if (norm === 0) {
    norm = 1;
  }

  return { vector, norm };
}

export function embedWorkspace(documents: WorkspaceDocument[]): VectorEmbedding[] {
  return documents.map((doc) => {
    const tokens = tokenize(doc.content);
    const { vector, norm } = buildVector(tokens);
    return {
      path: doc.path,
      vector,
      norm,
      preview: doc.content.slice(0, 400),
    };
  });
}

export function queryEmbedding(
  embeddings: VectorEmbedding[],
  query: string,
  topK = 8,
  minScore = 0.12,
): VectorQueryResult[] {
  const tokens = tokenize(query);
  const { vector: queryVector, norm: queryNorm } = buildVector(tokens);

  const scores: VectorQueryResult[] = embeddings
    .map((embedding) => {
      let dot = 0;
      for (let i = 0; i < VECTOR_SIZE; i++) {
        dot += embedding.vector[i]! * queryVector[i]!;
      }
      const similarity = dot / (embedding.norm * queryNorm);
      return {
        path: embedding.path,
        preview: embedding.preview,
        similarity: Number.isFinite(similarity) ? similarity : 0,
      };
    })
    .filter((result) => result.similarity >= minScore)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scores;
}

