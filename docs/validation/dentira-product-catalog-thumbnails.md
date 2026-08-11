# Dentira Product Catalog Thumbnail Evidence

## Scope

This validation note covers the demo thumbnail assets added for the Dentira
Product Catalog. The assets are derived from Dentira-supplied Patterson order
evidence for purchase order `PTU317717`.

## Source Evidence

- Source PO: `PTU317717`
- Order number: `6209555669`
- Source artifact: `database/sources/dentira_po_ptu317717.json`
- Source screenshots: `IMG_4093.PNG`, `IMG_4094.PNG`, `IMG_4095.PNG`,
  `IMG_4096.PNG`
- Product lines represented: `42`
- Thumbnail assets created: `42`

The thumbnails are cropped from the product image column in the supplied order
details evidence and mapped by source PO number plus source line number.

## Mapping

Assets are stored at:

`frontend/public/dentira/product-catalog/ptu317717/line-001.png`
through:
`frontend/public/dentira/product-catalog/ptu317717/line-042.png`

The frontend maps thumbnails using the stable source key:

`PTU317717:<source_line_number>`

Unmapped products, uncertain mappings, or failed image loads use a neutral
catalog placeholder instead of showing a potentially mismatched product image.

## Demo Truthfulness

- Thumbnails identify purchasing catalog products only.
- Thumbnails do not imply current inventory availability.
- PO-backed products still do not show on-hand quantity, par level, reorder
  point, storage location, low-stock status, or inventory status unless real
  inventory records exist.
- These source-evidence crops are suitable for the Dentira staging demo.
- Production catalog imagery should be approved separately before broader use.

## Validation Checklist

- Confirm all 42 source lines have a corresponding `line-###.png` asset.
- Confirm representative thumbnails match their source line:
  - Line 1: Braval small gloves, item `070367854`
  - Line 5: HealiAid collagen plug, item `HACOLLP`
  - Line 8: Solmetex NXT Hg5, item `NXTHG5002CR`
  - Line 34: Septocaine, item `01A1400`
  - Line 42: Reli scalpel, item `6008TR15`
- Confirm unknown or failed images render the neutral catalog placeholder.
- Confirm Inventory remains separate from Product Catalog data.
