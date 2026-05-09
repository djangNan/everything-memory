"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/products";

export default function TrackProductView({ product }: { product: Product }) {
  useEffect(() => {
    window.EM?.track("product_view", {
      name: product.name,
      category: product.category,
      price: product.price,
    });
  }, [product.name, product.category, product.price]);
  return null;
}
