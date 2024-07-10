import { generateEmbeddings } from "@/utils/generate-embeddings";

export async function POST(req: Request) {
  const { name, des } = await req.json();

  let d = await generateEmbeddings()

  console.log(JSON.stringify(d));

  return new Response(JSON.stringify(d));
}
