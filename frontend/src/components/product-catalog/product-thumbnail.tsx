"use client";

import Image from "next/image";
import { useState } from "react";

import { getProductThumbnailSrc } from "./product-image-map";
import type { ProductCatalogItem } from "@/types/contracts";

const ProductPlaceholder = ({ item }: { item: ProductCatalogItem }) => {
  const initials = (item.brand_or_manufacturer ?? item.supplier_name ?? "PO")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex aspect-square min-h-[92px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
      <div className="text-center">
        <p className="text-xl font-bold text-lighthouse-primary">
          {initials || "PO"}
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Catalog
        </p>
      </div>
    </div>
  );
};

export const ProductThumbnail = ({ item }: { item: ProductCatalogItem }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const src = imageFailed ? null : getProductThumbnailSrc(item);

  if (!src) {
    return <ProductPlaceholder item={item} />;
  }

  return (
    <div className="flex aspect-square min-h-[92px] items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
      <Image
        src={src}
        alt={`${item.product_name ?? "Catalog product"} thumbnail from Dentira order evidence`}
        width={145}
        height={80}
        className="h-full w-full object-contain"
        onError={() => setImageFailed(true)}
        priority={false}
      />
    </div>
  );
};
