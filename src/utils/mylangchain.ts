import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { generateEmbedding, genollama } from "./myollama";
import { supabase } from "./supabase";
import { cosineSimilarity } from "langchain/util/math";

export async function addProduct(name: any, description: any) {

  const embedding = await generateEmbedding(description);
  const { data, error } = await supabase
    .from("products")
    .insert([{ product_name: name, description, embedding: embedding }]);
  if (error) throw error;
  return data;
}
// export async function searchProducts(query: any) {
//   console.log(query)
//   const queryEmbedding = await genollama(query);
//   const { data: products, error } = await supabase.from("products").select("*");
//   if (error) throw error;

//   console.log(queryEmbedding);
//   const results = products.map((product) => {
//     return {
//       ...product,
//       similarity: cosineSimilarity(queryEmbedding, product.embedding),
//     };
//   });
//   console.log(results);

//   return results.sort((a, b) => b.similarity - a.similarity);
// }

export async function mysearch(query: any) {
  const embeddings = await genollama(query);
  console.log(embeddings);
  const { data,error } = await supabase.rpc("myhola_match_documents", {
    query_embedding: embeddings, // pass the query embedding
    // match_threshold: 0.78, // choose an appropriate threshold for your data
    match_count: 5, // choose the number of matches

  });

  console.log(data);

  return data;
}
