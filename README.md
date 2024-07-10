## Overview
This project involves setting up a semantic search functionality using Supabase, Ollama (nomic-embed-text), Langchain, and Next.js. The following steps will guide you through creating the necessary database schema, functions, and API endpoints.

## Prerequisites
- Supabase account
- Node.js
- Next.js
- Ollama Embeddings API running locally

## Steps

### Step 1: Setup Database in Supabase
Run the following SQL command in your Supabase SQL editor to create the `myproducts` table:

```sql
CREATE TABLE myproducts (
  id BIGSERIAL PRIMARY KEY,
  product_name TEXT, -- corresponds to Document.pageContent
  description TEXT,
  metadata JSONB, -- corresponds to Document.metadata
  embedding VECTOR(768) -- 1536 works for OpenAI embeddings, change if needed
);
```

### Step 2: Create the Function for Document Matching
Run the following SQL commands in your Supabase SQL editor to create the function `myhola_match_documents`:

```sql
-- Drop the existing function
DROP FUNCTION IF EXISTS myhola_match_documents(vector(768), integer, jsonb);

-- Create the new function with all information in metadata
CREATE OR REPLACE FUNCTION myhola_match_documents(
  query_embedding VECTOR(768),
  match_count INTEGER DEFAULT NULL,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  embedding JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    myproducts.id,
    '' AS content,  -- We'll keep this empty as we're using metadata
    jsonb_build_object(
      'id', myproducts.id,
      'product_name', myproducts.product_name,
      'description', myproducts.description
    ) || myproducts.metadata AS metadata,  -- Combine new and existing metadata
    (myproducts.embedding::TEXT)::jsonb AS embedding,
    1 - (myproducts.embedding <=> query_embedding) AS similarity
  FROM myproducts
  WHERE myproducts.metadata @> filter
  ORDER BY myproducts.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Step 3: Create a Search API Route
Create a new API route `api/search` in your Next.js application:

```javascript
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
```

### Step 4: Single Text Embedding
Create a function to generate embeddings for single text inputs:

```javascript
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
```

### Step 5: Utility for Ollama Embeddings
Create a utility file `src/utils/ollama-embeddings.ts`:

```javascript
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
    console.log(result.embedding);
    return result.embedding;
  };

  const embed = async (texts: string[]): Promise<number[][]> => {
    return await Promise.all(texts.map(embedQuery));
  };

  return { embedQuery, embed };
}
```

### Step 6: Generate Embeddings for All Data in the Database
Create a script to generate embeddings for all products in your database:

```javascript
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
    .select('id, product_name, metadata');
    // .is('embedding', null);  // Uncomment this line if you want to filter products without embeddings

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
```

### Step 7: Alternative Search with Supabase RPC
Create a function to search using the Supabase RPC:

```javascript
export async function mysearch(query: any) {
  const embeddings = await genollama(query);
  console.log(embeddings);

  const { data, error } = await supabase.rpc("myhola_match_documents", {
    query_embedding: embeddings, // pass the query embedding
    match_count: 5, // choose the number of matches
  });

  if (error) {
    console.error('Error during search:', error);
    return null;
  }

  console.log(data);
  return data;
}
```

## Running the Project
1. Make sure your Supabase project is set up with the provided SQL schema and function.
2. Ensure your Next.js application has the necessary environment variables for Supabase.
3. Start your Ollama Embeddings API on `http://localhost:11434`.
4. Run your Next.js application.
5. Use the provided API routes and scripts to generate embeddings and perform searches.

## Conclusion
This README provides a comprehensive guide to setting up a semantic search functionality using Supabase, Ollama, Langchain, and Next.js. Follow each step carefully to ensure a successful implementation.