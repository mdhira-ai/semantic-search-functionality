// File: src/utils/ollama-embeddings.ts
export function createOllamaEmbeddings(modelName: string = 'nomic-embed-text') {
  const embedQuery = async (text: string): Promise<number[]> => {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: text,
        options: {
          embedding: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result.embedding)
    return result.embedding;
  };

  const embed = async (texts: string[]): Promise<number[][]> => {
    return await Promise.all(texts.map(embedQuery));
  };

  return { embedQuery, embed };
}