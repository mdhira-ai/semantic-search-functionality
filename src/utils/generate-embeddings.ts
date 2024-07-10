import { createClient } from '@supabase/supabase-js';
import { createOllamaEmbeddings } from './ollama-embeddings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateEmbeddings() {
  const embeddings = createOllamaEmbeddings();

  // Fetch all products without embeddings
  const { data: products, error } = await supabase
    .from('myproducts')
    .select('id, product_name, metadata')
    // .is('embedding', null);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  for (const product of products) {
    const text = `${product.product_name} ${product.metadata}`;
    const [embedding] = await embeddings.embed([text]);

    const { error: updateError } = await supabase
      .from('myproducts')
      .update({ embedding })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Error updating product ${product.id}:`, updateError);
    } else {
      console.log(`Updated embedding for product ${product.id}`);
    }
  }

  console.log('Finished generating embeddings');
}
