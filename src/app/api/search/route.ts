import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    console.log("Received query:", query);

    const ollama = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://localhost:11434",
      requestOptions: {
        useMMap: true,
        numThread: 6,
        numGpu: 4,
      },
    });

    const vectorStore = await SupabaseVectorStore.fromExistingIndex(ollama, {
      client: supabase,
      tableName: "myproducts",
      queryName: "myhola_match_documents",
    });

    console.log("Vector store setup completed");

    const results = await vectorStore.similaritySearch(query, 2);

    console.log("Search results:", results);

    return Response.json(results);
  } catch (error: any) {
    console.error("Error during search:", error);
    console.error("Error stack:", error.stack);
    return Response.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
