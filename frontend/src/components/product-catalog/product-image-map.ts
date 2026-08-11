import type { ProductCatalogItem } from "@/types/contracts";

const DENTIRA_PO_NUMBER = "PTU317717";
const ASSET_BASE_PATH = "/dentira/product-catalog/ptu317717";

export const dentiraProductThumbnailMap = Object.fromEntries(
  Array.from({ length: 42 }, (_, index) => {
    const lineNumber = index + 1;
    return [
      `${DENTIRA_PO_NUMBER}:${lineNumber}`,
      `${ASSET_BASE_PATH}/line-${String(lineNumber).padStart(3, "0")}.png`,
    ];
  }),
) as Record<string, string>;

export const getProductThumbnailSrc = (item: ProductCatalogItem) => {
  if (
    item.source_po_number !== DENTIRA_PO_NUMBER ||
    item.source_line_number === null
  ) {
    return null;
  }

  return (
    dentiraProductThumbnailMap[
      `${item.source_po_number}:${item.source_line_number}`
    ] ?? null
  );
};
