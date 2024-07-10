import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

let ollamaurl = "http://localhost:11434/api/embeddings";

export async function generateEmbedding(text: any) {
  const response = await fetch(ollamaurl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
      options: {
        embedding: true,
      },
    }),
  });
  const d = await response.json();
  return d.embedding;
}

export async function genollama(text: any) {
  const ollama = new OllamaEmbeddings({
    model: "nomic-embed-text", // default value
    baseUrl: "http://localhost:11434", // default value
    requestOptions: {
      useMMap: true,
      numThread: 6,
      numGpu: 1,
    },
  });

  const embedding = await ollama.embedQuery(text);

  return embedding;
}
