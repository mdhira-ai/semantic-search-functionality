import { supabase } from "@/utils/supabase";

export async function GET(req: Request) {
  const { data: productsData, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  const updatedProductsData = [];

  for (const product of productsData) {
    const metadata = product.metadata;
    const { data, error } = await supabase
      .from("products")
      .update({
        metadata: {
          product_name: product.product_name,
          product_description: product.description
        },
      })
      .eq("id",
        product.id
      )
      .select();

    if (error) {
      console.error("Error updating product:", error);
    } else {
      updatedProductsData.push(...data);
    }
  }

  return new Response(JSON.stringify(updatedProductsData));
}
