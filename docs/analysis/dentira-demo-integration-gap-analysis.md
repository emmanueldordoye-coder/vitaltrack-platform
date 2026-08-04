# Dentira Demo Integration Gap Analysis

**Project**: Project Lighthouse MVP
**Audience**: VitalTrack Technologies / Dentira demo team
**Date**: 2026-08-03
**Status**: Analysis only; no implementation changes included

## Current-State Summary

The live VitalTrack MVP is deployed and browser validated for the core authenticated workflow:

1. Sign in
2. Organization membership resolution
3. Dashboard
4. Facilities
5. Inventory
6. Purchase Orders

The current production frontend is intentionally simple. It uses a generic VitalTrack authenticated shell, a sidebar navigation, server-rendered pages, simple stat cards, and basic tables. It is functionally validated, but it does not yet visually match the Dentira-specific Figma design.

Confirmed staging validation evidence is documented in `docs/validation/project-lighthouse-mvp-browser-validation.md`.

## Figma References

| Design Surface | Figma Reference | Inspection Status |
| --- | --- | --- |
| Inventory Catalog | `https://www.figma.com/make/2EVPJxnjg3oowPTcR7AqIb/Design-Inventory-Catalog-Screen?t=bhKIdJBZ1KRUq4MN-1` | Figma Make context inspected with file key `2EVPJxnjg3oowPTcR7AqIb` and root node `0:1`. |
| Published Dashboard / Shell | `https://yang-clad-06271710.figma.site` | Rendered in headless Chrome and inspected through the published Figma Make bundle. |
| Dashboard design node | Not yet provided as a `/design/` URL with `node-id` | Pixel-perfect Figma frame metadata remains pending, but the published dashboard reference is inspectable. |

## Audit Constraint

The supplied Inventory Catalog reference is a Figma Make URL, not a regular Figma `/design/` frame URL. The Figma connector returned the Make application resource inventory, including page files and theme files, but did not expose readable source contents through the available resource reader. The screenshot endpoint also rejected the Make root with `INVALID_ARGUMENT`, which is consistent with the screenshot tool supporting `/design/` nodes rather than Make files.

The published Figma site at `https://yang-clad-06271710.figma.site` was inspectable through a JavaScript-enabled browser and its generated component bundle. The visible published route is the Dashboard screen. The bundle also exposes the Inventory Catalog component structure and static sample data, so this report now distinguishes visible published Dashboard evidence from bundled Inventory Catalog implementation details.

Because of that, this report separates:

- Confirmed production code, API, and seed-data facts.
- Confirmed Figma Make application structure from the connector response.
- Figma-to-production gaps that can be mapped from the Make app's exposed page/component inventory and published site bundle.
- Design-token details confirmed from the published CSS bundle.
- Pixel-perfect node geometry that still requires a regular Figma `/design/` node URL.

No claims below invent unseen colors, spacing, chart values, or unsupported product functionality.

## Current Production Frontend Audit

### Existing Pages

| Route | File | Current Purpose |
| --- | --- | --- |
| `/sign-in` | `frontend/src/app/(auth)/sign-in/page.tsx` | Supabase-backed sign-in form. |
| `/dashboard` | `frontend/src/app/(app)/dashboard/page.tsx` | Counts facilities, inventory items, and purchase orders from backend list APIs. |
| `/facilities` | `frontend/src/app/(app)/facilities/page.tsx` | Lists facilities and still shows a generic create-facility form. |
| `/inventory` | `frontend/src/app/(app)/inventory/page.tsx` | Lists Lighthouse inventory rows from `GET /api/v1/inventory`. |
| `/purchase-orders` | `frontend/src/app/(app)/purchase-orders/page.tsx` | Lists purchase orders from `GET /api/v1/purchase-orders`. |

### Existing Reusable Components

| Component | File | Reuse Potential |
| --- | --- | --- |
| Authenticated app shell | `frontend/src/app/(app)/layout.tsx` | Provides sidebar shell, user email display, sign out, and main content region. |
| Navigation links | `frontend/src/components/layout/nav-links.tsx` | Existing route list for Dashboard, Facilities, Inventory, Purchase Orders. |
| Stat card | `frontend/src/components/dashboard/stat-card.tsx` | Can support Figma dashboard KPI cards if styling and labels are adjusted. |
| Backend auth diagnostic panel | `frontend/src/components/auth/backend-auth-error.tsx` | Keep for staging diagnostics; not a demo feature surface. |
| Form message | `frontend/src/components/forms/form-message.tsx` | Existing small form feedback component. |

### Available Dashboard Metrics

The current dashboard loads three list endpoints and displays only counts:

| Metric | Current Source | Current Display |
| --- | --- | --- |
| Facilities | `apiClient.listFacilities({ limit: 10 })` | Count of returned rows. |
| Inventory items | `apiClient.listInventoryItems({ limit: 10 })` | Count of returned rows. |
| Purchase orders | `apiClient.listPurchaseOrders({ limit: 10 })` | Count of returned rows. |

The backend inventory response includes `is_low_stock`, so the frontend could derive a low-stock count from the inventory list in the demo slice. There is no dedicated dashboard summary endpoint yet.

### Current Inventory Fields

The production `/inventory` page renders:

| UI Field | API Field | Data Source |
| --- | --- | --- |
| SKU | `sku` | `products.sku` |
| Product | `product_name` | `products.name` |
| MPN | `manufacturer_part_number` | `products.manufacturer_part_number` |
| Location | `location_name` | `locations.name` |
| Qty | `current_quantity` | `inventory_levels.current_quantity` |
| Par | `par_level` | `inventory_levels.par_level` |
| Reorder | `reorder_point` | `inventory_levels.reorder_point` |
| Vendor | `vendor_name` | `vendors.name` resolved through product metadata `primary_vendor_code` |
| Unit cost | `unit_cost` | `products.metadata.unit_cost` |
| Status | `is_low_stock` | Calculated as `current_quantity <= reorder_point` |

Current backend filtering supports `search`, `isActive`, and `limit`. The frontend currently calls only `limit: 50` and does not render search controls.

### Current Facility Fields

The production `/facilities` page renders:

| UI Field | API Field |
| --- | --- |
| Name | `name` |
| Type | `facility_type` |
| City | `city` |
| Timezone | `timezone` |

The facility API can also return address, state, postal code, country, phone, email, active status, metadata, and timestamps, but those are not currently rendered.

### Current Purchase-Order Fields

The production `/purchase-orders` page renders:

| UI Field | API Field |
| --- | --- |
| PO Number | `po_number` |
| Status | `status` |
| Total | `currency`, `total_amount` |
| Date | `po_date` |

The API can also return facility id, supplier id, delivery dates, notes, creator/updater ids, timestamps, and order items on detail routes. The page does not currently render supplier/vendor name, line items, suggested-order origin, receiving state, or empty-state copy.

## Figma-To-Production Component Map

The Figma Make application exposes the following relevant source surfaces:

- `src/app/Layout.tsx`
- `src/app/pages/Dashboard.tsx`
- `src/app/pages/Inventory.tsx`
- `src/app/pages/InventoryUpdated.tsx`
- `src/app/pages/Orders.tsx`
- `src/app/pages/SuggestedOrders.tsx`
- `src/app/pages/SuggestedOrderReview.tsx`
- `src/app/pages/PurchaseConfirmation.tsx`
- `src/app/pages/Receiving.tsx`
- `src/app/pages/Vendors.tsx`
- `src/app/routes.ts`
- `src/styles/theme.css`
- `src/styles/globals.css`
- shadcn-style UI primitives including card, badge, button, input, table, tabs, chart, avatar, sidebar, progress, select, and tooltip components

This confirms the design concept is broader than the currently deployed MVP. The live app should only implement and visually align the currently supported surfaces unless a separate workflow implementation ticket is approved.

| Figma Surface / Visible Element | Production Component | Existing API/Data Field | Gap Classification |
| --- | --- | --- | --- |
| Dentira-branded sign-in screen | Existing sign-in page and form | Supabase Auth | Missing Dentira-specific visual treatment and customer-safe copy. |
| Dentira dashboard shell/navigation | Existing app layout and nav links | Supabase session email | Partial component exists; missing Dentira org/facility context in shell. |
| User/profile display | Existing sidebar email text | `sessionUser.user.email` | Missing full name, role, organization, facility, and demo-friendly user presentation. |
| Dashboard KPI cards | Existing `StatCard` | Facility, inventory, PO list counts | Component exists; metric set is sparse and generic. |
| Low-stock summary | No dedicated component | `GET /api/v1/inventory` includes `is_low_stock` | Missing dashboard card/summary; can be derived for demo without backend rebuild. |
| Patterson/vendor context | Inventory table vendor column | `vendor_name`, product metadata | Existing inventory row field; not elevated in dashboard. |
| Inventory table | Existing inventory table | Product, inventory, location, vendor fields | Data is present; visual design likely needs Figma styling, density, labels, and search controls. |
| Inventory search/filter | No visible control | Backend supports `search` query | Missing component; API support already exists. |
| Facility summary/list | Existing facility table | Facility list API | Data exists; design likely needs Dentira-specific presentation. |
| Purchase-order list | Existing PO table | Purchase order list API | Component exists but empty in Dentira seed; missing demo-specific empty state or seeded PO preview. |
| Suggested order generation/review | No production page | Database RPCs/tables exist | Missing UI and API endpoints in current frontend/backend surface; outside the validated `/inventory` PR slice. |
| Purchase confirmation | No production page | Database tables/functions exist | Missing UI/API integration; future Project Lighthouse workflow work. |
| Receiving/inventory update | No production page | Database trigger/function exists | Missing UI/API integration; future workflow work. |
| Static Dentira demonstration copy | Generic VitalTrack copy | Static frontend text | Missing Dentira-specific labels and honest demo context. |

## Published Dashboard Figma-To-Production Map

The published Figma site renders a desktop Dashboard in a 220px left sidebar plus a top header and scrollable main content area. The visual language uses Plus Jakarta Sans, a deep navy sidebar, light gray app background, white rounded cards, compact typography, thin slate borders, and small lucide-style icons.

| Published Dashboard Element | Visible Figma Detail | Production Status | Data Dependency | Implementation Classification |
| --- | --- | --- | --- | --- |
| Sidebar brand area | White logo tile above `VitalTrack Technologies` branding | Existing shell has text brand only | Static logo/brand asset | Demo-critical visual gap; use existing app shell. |
| Sidebar navigation | Dashboard, Inventory, AI Recommendations with `NEW`, Order Review with `STEP 2`, Orders badge `4`, Receiving, Analytics, Vendors, Reports, Team, Settings | Production nav has Dashboard, Facilities, Inventory, Purchase Orders | Static route list | Demo-critical: only show supported routes or disabled/static labels; do not imply AI/analytics/receiving are live. |
| User card | `Eric Rawls`, `Regional Supply Manager`, initials `ER` | Production shell shows auth email only | Session email; no first/last/role UI field currently exposed | Demo-critical visual gap; static demo display is acceptable if documented, or expose workspace context later. |
| Top breadcrumb | `Operations > Dashboard` | Production pages do not use breadcrumb | Static page context | Demo-critical visual gap. |
| Notification button | Bell icon with red unread dot and dropdown copy | Not present | Static/bundled notifications only | Future enhancement; avoid showing active notification feature unless static/noninteractive. |
| Greeting header | `Good morning, Eric`; `Eric Rawls · Regional Supply Manager · Dentira`; Refresh button | Production dashboard title is generic | Session/workspace plus static copy | Demo-critical; can be static for demo if not claimed as profile management. |
| KPI grid | 3 columns x 2 rows of compact cards | Existing `StatCard` can be reused | Mixed live and unsupported values | Use live-backed cards first; static-only cards must be clearly demo content or omitted. |
| Total Inventory Value card | `$47,820`, `132 SKUs · 4 locations`, `+$2,140 vs last month` | Not currently computed | Current inventory has 7 rows and unit costs; no 132 SKU/live trend data | Unsupported as shown; can compute visible inventory value only. |
| Month-to-Date Spend card | `$14,240`, `July 2026 · 18 days remaining`, `-12% vs June` | Not supported | No spend history endpoint/seed | Static demo-only or future analytics; do not claim live. |
| Estimated Monthly Savings card | `$1,340`, `vs. ad-hoc purchasing`, `+$240 vs last month` | Not supported | Prior average cost exists in product metadata, but no monthly baseline endpoint | Static demo-only; pilot-critical if savings remains in demo story. |
| Products Running Low card | `7`, `3 critical · 4 below par`, `+2 since last week` | Partially supported | `GET /api/v1/inventory` includes `is_low_stock`; no critical/below-par/trend split | Demo-critical if shown; support honest low-stock count only. |
| Pending Orders card | `4`, `Est. $6,740 · 3 vendors` | Not supported in Dentira seed | Purchase Orders API exists, but Dentira seed currently has no POs | Static demo-only or requires approved seed update. |
| Time Saved card | `6.5 hrs`, `vs. manual ordering workflow` | Not supported | No workflow time tracking | Future enhancement/static marketing copy only. |
| Active Alerts panel | Six alerts with Reorder buttons and `Review AI Recommendations` CTA | No production alert component | Some low-stock rows exist; expiration/vendor delay/AI recommendation data is not live | Demo-critical gap if dashboard must match; only low-stock alert copy can be honest today. |
| Monthly Spend chart | Spline chart from Feb-Jul with `$14,240 this month` | Not present | No spend history endpoint/seed | Future analytics/static demo-only. |
| Spend by Category chart | Bar chart: Restorative, PPE, Anesthesia, Surgical, Preventive, Sterile | Not present | Inventory categories exist, spend by category does not | Future analytics; avoid unless computed as inventory value by category and labeled accurately. |
| Open Purchase Orders table | PO-4821 through PO-4818, vendor, items, total, status, ETA, Track action | Production PO page exists but Dentira seed is empty | Purchase Orders API supports rows, but current Dentira seed has none | Demo-critical decision: seed approved read-only POs or show an honest empty state. |

## Inventory Catalog Figma-To-Production Map

This section maps the supplied Figma Make Inventory Catalog design to the validated production `/inventory` route. The component source was inferred from the published bundle; the published route itself currently opens on Dashboard.

| Inventory Catalog Element | Production Status | Production Location | Data Dependency | Implementation Classification |
| --- | --- | --- | --- | --- |
| Authenticated workspace shell | Exists | `frontend/src/app/(app)/layout.tsx` | Supabase session user email | Reuse and restyle. |
| Sidebar navigation | Exists | `frontend/src/components/layout/nav-links.tsx` | Static route list | Reuse and restyle; do not add unsupported workflow routes to the live MVP nav unless hidden/disabled. |
| User/workspace context | Partial | Sidebar shows `sessionUser.user.email` | Supabase session; backend organization membership exists but is not exposed as a UI field | Demo-critical gap: show Dentira workspace context honestly. |
| Inventory page title | Exists | `frontend/src/app/(app)/inventory/page.tsx` | Static text | Reuse and restyle. |
| Product catalog subtitle/context text | Exists | Inventory page header copy | Static text | Reuse; update copy only to match Figma if it stays honest. |
| Inventory table container | Exists | Inventory page table wrapper | `GET /api/v1/inventory` | Reuse and restyle. |
| SKU column | Exists | Inventory table | `sku` from `products.sku` | Supported live data. |
| Product/name column | Exists | Inventory table | `product_name` from `products.name` | Supported live data. |
| Manufacturer part number column | Exists as `MPN` in production; Figma table prioritizes product/category/vendor | Inventory table | `manufacturer_part_number` | Supported live data, but not visible in the extracted Figma table header. |
| Category column | Missing in production UI | Figma Inventory table | Product category exists in catalog seed | Demo-critical if Figma table parity is required; backend read path currently does not return category. |
| Location column | Exists | Inventory table | `location_name` from `locations.name` | Supported live data. |
| Quantity/current stock column | Exists as `Qty` | Inventory table | `current_quantity` | Supported live data. |
| Par level column | Exists as `Par` | Inventory table | `par_level` | Supported live data. |
| Reorder point column | Exists as `Reorder` | Inventory table | `reorder_point` | Supported live data. |
| Vendor/supplier column | Exists | Inventory table | `vendor_name`, resolved through Patterson vendor metadata | Supported live data. |
| Unit cost column | Exists | Inventory table | `unit_cost` from product metadata | Supported live data. |
| Stock status badge | Exists | Inventory table | `is_low_stock`, computed as `current_quantity <= reorder_point` | Supported computed value. |
| Search/filter control | Missing in UI | Figma search placeholder: `Search products, SKU, vendor...`; backend supports `search` query | `GET /api/v1/inventory?search=` across product name, SKU, MPN | Demo-critical gap; no backend rebuild needed for name/SKU/MPN search. Vendor search would need backend support or copy adjustment. |
| Category filter chips | Missing in production UI | `All`, `PPE`, `Restorative`, `Preventive`, `Anesthesia`, `Impressions`, `Surgical`, `Imaging`, `Diagnostic`, `Sterilization` | Category seed exists, but current endpoint does not return/filter category | Do not claim support until backend read path is updated. |
| Vendor filter dropdown | Missing in production UI | All Vendors plus dental suppliers including Patterson Dental | Current endpoint returns vendor name but does not support vendor filter | Demo-critical only if visual parity requires it; implement honestly or leave static disabled. |
| Location filter dropdown | Missing in production UI | All Locations plus multiple demo offices | Dentira seed has one facility and four storage locations, not the Figma's four dental offices | Static/demo-only unless seed model is intentionally expanded. |
| Inventory summary cards | Missing on inventory page | Total SKUs, Low Stock, Critical, Out of Stock, Expiring Soon | Total and low-stock can be derived; critical/out-of-stock/expiring are not supported by current status model | Demo-safe only for supported totals/low-stock; others require explicit seed/API support. |
| Reorder alert strip | Missing | `X items need immediate reorder`, `Reorder All` | Suggested ordering UI not wired | Unsupported today; do not enable. |
| Header actions | Missing | Sync, Export, Add Item | No export/add workflow in current scope | Demo-only/unsupported; omit or disable. |
| Table columns | Partial | Product, Category, Vendor, Qty, Par, Reorder, Stock Level, Status, Days, action | Current API supports most inventory values except category and days remaining | Demo-critical styling gap; category/days require data or omission. |
| Product images | Missing | Figma uses 64px product thumbnails from stock image URLs | No product images in Dentira seed/API | Future enhancement or static decorative-only. |
| Suggested order CTA | Missing in production UI | Figma includes AI Recommendations/Order Review routes and reorder buttons | Database RPC exists; no production API/UI workflow | Must not be enabled or implied unless a separate workflow slice is built. |
| Supplier integration / submit to Patterson | Not implemented | None | Vendor is mock Patterson data only | Unsupported; must remain static/mock language only. |
| Charts | Not present in production inventory page | None | No chart endpoint | Unsupported unless chart is static decorative content or derived transparently from visible rows. |
| Icons | Production currently uses text-only nav/table | None | Figma bundle uses lucide-style icons for sidebar, alerts, refresh, download, plus, search, sort, bell, charts | Demo-critical visual gap; use lucide icons where already available or add the existing icon package if present. |

## Design Tokens From Available Evidence

The current production app uses Tailwind with a small `brand` palette:

| Token | Current Value |
| --- | --- |
| `brand.50` | `#f3f5ff` |
| `brand.500` | `#4253d6` |
| `brand.700` | `#2f3db3` |
| Page background | `slate-50` |
| Text color | `slate-900` |
| Cards/tables | white surfaces with `slate-200` borders |

The Figma Make bundle references `default_shadcn_theme.css`, `src/styles/theme.css`, `src/styles/globals.css`, `src/styles/fonts.css`, and shadcn-style UI primitives. Exact Figma token values cannot be confirmed from the current connector response because the files are listed but not readable through the available resource reader.

The published CSS bundle confirms these additional design tokens:

| Token | Figma Published Value |
| --- | --- |
| Font | `Plus Jakarta Sans`, with `JetBrains Mono` for small metadata/monospace labels |
| App background | `#eef0f4` |
| Text foreground | `#111827` |
| Primary/nav navy | `#16305e` |
| Accent green | `#0a9e6b` |
| Destructive red | `#dc2626` |
| Secondary surface | `#e4e8f0` |
| Muted surface | `#e8ecf2` |
| Border | `#00000014` |
| Radius | `0.625rem` token, with published cards using `rounded-xl` |

Implementation should map these into the existing Tailwind theme or component classes without changing backend behavior.

## Dentira Seed And Catalog Data Completeness

### Seed Totals

| Entity | Count | Notes |
| --- | ---: | --- |
| Organizations | 1 | `Dentira Dental Group` / `dentira-demo`. |
| Facilities | 1 | `Dentira Main Office`, Austin, TX. |
| Departments | 1 | `Clinical Operations`. |
| Locations | 4 | Main Supply Stockroom, Hygiene Bay, Sterilization Room, Operatory Closet. |
| Vendors | 1 | Patterson Dental mock supplier. |
| Units of measure | 3 | Box, Bag, Case. |
| Categories | 6 | Personal Protection, Evacuation, Preventive, Sterilization, Operatory, Patient Care. |
| Products | 7 | Dental supplies mapped to Patterson metadata. |
| Inventory levels | 7 | One row per seeded product/location combination. |
| Purchase orders | 0 in Dentira seed | Purchase Orders page currently validates access but has no Dentira PO rows. |
| Manufacturers | 0 in Dentira seed | Product rows use manufacturer part numbers but do not seed manufacturer entities. |

### Product And Inventory Rows

| SKU | Product | Category | UOM | Location | Qty | Par | Reorder | Unit Cost | Prior Avg Cost | Status |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `PAT-GLV-NIT-M` | Nitrile Exam Gloves, Medium | Personal Protection | box | Main Supply Stockroom | 18 | 60 | 30 | 7.35 | 8.20 | Low stock |
| `PAT-SAL-EJ-100` | Disposable Saliva Ejectors | Evacuation | bag | Operatory Closet | 24 | 72 | 36 | 5.90 | 6.55 | Low stock |
| `PAT-PRO-ANGLE` | Disposable Prophy Angles, Soft Cup | Preventive | box | Hygiene Bay | 5 | 18 | 10 | 31.50 | 34.75 | Low stock |
| `PAT-STER-3510` | Sterilization Pouches 3.5 x 10 | Sterilization | box | Sterilization Room | 8 | 30 | 15 | 18.25 | 20.10 | Low stock |
| `PAT-AW-TIPS` | Air/Water Syringe Tips | Operatory | bag | Operatory Closet | 11 | 36 | 18 | 16.40 | 18.15 | Low stock |
| `PAT-BIB-2PLY` | Dental Bibs, 2-Ply Poly | Patient Care | case | Main Supply Stockroom | 4 | 8 | 4 | 42.80 | 45.20 | Low stock |
| `PAT-FLUOR-VARN` | Fluoride Varnish Unit Dose | Preventive | box | Hygiene Bay | 10 | 12 | 6 | 62.25 | 64.40 | In stock |

### Data Strengths

- Product SKUs, names, descriptions, categories, UOMs, manufacturer part numbers, vendor SKU metadata, unit costs, prior average costs, minimum order quantities, order multiples, current quantities, par levels, reorder points, and locations are present for all seven products.
- The seed is idempotent through stable UUIDs and `ON CONFLICT` upserts.
- The inventory list is populated with Dentira-specific dental supplies and Patterson Dental supplier context.

### Missing Or Placeholder Values

- No manufacturer rows are seeded, so `products.manufacturer_id` remains unavailable for the Dentira catalog even though `manufacturer_part_number` exists.
- Vendor association is normalized in `vendors`, but product-to-vendor mapping is currently stored in product metadata via `primary_vendor_code` instead of a product-vendor join table.
- Vendor contact email uses a demo placeholder domain: `orders@patterson-demo.example`.
- The seed does not create purchase orders, suggested orders, receiving events, or PO line items for a demonstration state.
- No product GTINs, images, package-size display labels, lead-time values, or real Patterson integration identifiers are seeded.
- Facilities have only one site; multi-site behavior is not represented in Dentira seed data.

### Duplicates Or Normalization Issues

- No duplicate product SKUs are present in the Dentira seed.
- No duplicate category slugs or vendor codes are present.
- The main normalization gap is manufacturer absence and vendor mapping through metadata instead of a relational product-vendor mapping. This is acceptable for the current demo read path, but it is pilot-critical before a broader purchasing workflow.

## Screen-By-Screen Implementation Matrix

### Sign In

| Item | Current State | Gap | Priority |
| --- | --- | --- | --- |
| Authentication | Operational via Supabase Auth | None functionally | Demo-critical done |
| Visual alignment | Generic VitalTrack card | Match Dentira Figma styling and copy | Demo-critical |
| Demo user flow | Works with `1smoketest@vitaltrack.com` | Avoid exposing credentials in screenshots/docs | Demo-critical |

### Dashboard

| Item | Current State | Gap | Priority |
| --- | --- | --- | --- |
| Page access | Operational after membership resolution | None functionally | Demo-critical done |
| Metrics | Facilities, inventory item count, PO count | Add Dentira-relevant low-stock and supplier/order context if shown in Figma | Demo-critical |
| Visual design | Generic stat cards and sparse layout | Match Figma dashboard composition: 6 KPI cards, alerts panel, charts, PO table, compact shell | Demo-critical |
| Data honesty | Counts reflect live APIs | Avoid claiming unsupported AI recommendations, savings, spend trends, time-saved, or active PO data unless backed by seed/API | Demo-critical |

### Facilities

| Item | Current State | Gap | Priority |
| --- | --- | --- | --- |
| Facility list | Shows Dentira Main Office | None for basic validation | Demo-critical done |
| Fields | Name, type, city, timezone | Address/state may be hidden despite seed availability | Pilot-critical |
| Create form | Visible generic form | For demo, decide whether to hide or restyle as non-primary if Figma does not show creation | Demo-critical |
| Visual design | Generic table | Match Dentira design | Demo-critical |

### Inventory

| Item | Current State | Gap | Priority |
| --- | --- | --- | --- |
| Inventory rows | Shows seven Dentira product rows | None for basic catalog demo | Demo-critical done |
| Low stock | Displayed per row | Dashboard/summary low-stock aggregation missing | Demo-critical if in Figma |
| Search | Backend supports product name, SKU, and MPN search | No frontend search control | Demo-critical |
| Vendor/cost | Patterson and unit cost shown | Good for demo; may need visual treatment | Demo-critical |
| Suggested ordering | Not wired in UI | Out of current PR scope; needed for full ordering workflow demo | Pilot-critical |

### Purchase Orders

| Item | Current State | Gap | Priority |
| --- | --- | --- | --- |
| Page access | Operational | None for route validation | Demo-critical done |
| Data | Empty Dentira list | Needs honest empty state or demo PO data, depending Figma | Demo-critical |
| Fields | PO number, status, total, date | Missing vendor, item count, receiving/progress context | Pilot-critical |
| Suggested-order conversion | Database supports approval-to-PO path | No production UI/API workflow exposed | Pilot-critical |

### User/Profile Display

| Item | Current State | Gap | Priority |
| --- | --- | --- | --- |
| User identifier | Sidebar shows auth email | Missing display name, role, organization, facility | Demo-critical |
| Organization context | Resolved in backend | Not surfaced in UI | Demo-critical |
| Sign out | Operational | None | Demo-critical done |

## Work Classification

### A. Demo-Critical

1. Match the current shell, sign-in, dashboard, facility, inventory, and purchase-order screens to the Dentira Figma design using existing routes and APIs.
2. Add frontend inventory search controls that use the existing `GET /api/v1/inventory?search=` support.
3. Add Dentira workspace context in the shell: organization/facility label and demo-friendly user display.
4. Convert the Purchase Orders page from a blank table to an honest demo-safe empty state unless approved Dentira PO seed data is intentionally added.
5. Hide, de-emphasize, or restyle legacy create forms that are not part of the approved Figma flow.
6. Keep diagnostics available for failures but avoid making staging diagnostic panels part of the happy-path demo narrative.
7. Use the published Figma Dashboard/Shell and Inventory bundle mapping as the demo visual reference; request the `/design/` node only for pixel-perfect implementation.

### B. Pilot-Critical

1. Add API support for user workspace context if the UI should show organization, facility, and role without inferring from multiple endpoints.
2. Normalize manufacturer data if manufacturer names/logos/filters appear in pilot workflows.
3. Replace metadata-based product-vendor mapping with a relational product-vendor association if vendor-specific pricing or multi-vendor ordering enters the pilot.
4. Wire suggested-order generation, review, approval, PO creation, receiving, and inventory update through production APIs and UI.
5. Add seeded or generated purchase orders only when the workflow is ready to explain how they were created.

### C. Future Enhancement

1. Multi-location/multi-facility switching.
2. Product images, GTINs, richer catalog attributes, and Patterson integration identifiers.
3. Advanced dashboard analytics, savings trend charts, reporting, barcode scanning, notifications, or mobile-specific workflows.
4. Full purchasing lifecycle audit views beyond the MVP purchase-order list.

## Recommended Smallest Implementation Sequence

1. Align the authenticated shell with the published Figma site: 220px navy sidebar, compact top breadcrumb/header, Dentira user/workspace display, and supported nav only.
2. Restyle Dashboard with existing data first: facilities count, inventory count, purchase-order count, and a derived low-stock count from the existing inventory response. Omit or label static-only spend/savings/time-saved charts until backed by data.
3. Restyle Inventory and add search using the existing backend `search` query. Do not introduce a new endpoint.
4. Add only honest inventory summary cards: total visible rows and low-stock count. Defer critical/out-of-stock/expiring unless the data model is extended.
5. Restyle Facilities and decide whether the current create form should be hidden for demo parity.
6. Restyle Purchase Orders with an honest empty state or seed-approved read-only demo rows. Do not imply ordering automation is live unless the suggested-order UI is implemented.
7. Obtain a regular Figma `/design/` dashboard frame URL with `node-id` only if exact node geometry and responsive handoff are needed.
8. Only after the above is stable, start a separate pilot workflow ticket for suggested orders, approval, PO creation, and receiving UI.

## Estimated Effort

| Task | Estimate | Notes |
| --- | ---: | --- |
| Published Figma dashboard inspection and exact element inventory | Complete | Published site rendered and bundle inspected. |
| Pixel-perfect Figma node extraction | 0.5 day | Still requires dashboard `/design/` node URL. |
| Figma Make Inventory Catalog mapping | Complete | Make URL and published bundle inspected. |
| Dentira shell/profile visual alignment | 0.5-1 day | Mostly frontend styling and copy. |
| Dashboard visual parity with existing metrics | 1 day | Add low-stock derivation only if needed; no backend rebuild. |
| Inventory Figma styling and search control | 1 day | Existing API supports search. |
| Facilities page styling and demo-safe form decision | 0.5 day | Hide/restyle only if Figma requires it. |
| Purchase Orders empty/demo state styling | 0.5 day | Avoid fake functionality claims. |
| Regression tests for updated screens | 0.5-1 day | Focused React page/component tests. |

## Recommended First Implementation Ticket

**Title**: Align Project Lighthouse shell and dashboard with Dentira Figma design

**Scope**:

- Use the existing authenticated layout, nav links, stat card pattern, and backend list APIs.
- Add Dentira workspace/user context to the shell using existing authenticated data where possible.
- Restyle Sign In and Dashboard to match the Figma design.
- Use the published Figma Dashboard/Shell URL and supplied Figma Make Inventory Catalog reference as visual direction, but do not treat unsupported Make pages as live product scope.
- Use only existing metrics: facilities count, inventory count, purchase-order count, and optionally derived low-stock count from the existing inventory list.
- Keep copy honest: no AI, forecasting, supplier submission, receiving, barcode scanning, analytics, or ordering automation claims.

**Acceptance Criteria**:

- `/sign-in` and `/dashboard` visually match the supplied Dentira Figma screens within the existing app architecture.
- Authenticated browser validation still passes.
- Dashboard metrics remain backed by current APIs.
- No migrations, auth weakening, backend rebuild, or new product features are introduced.

## Required Follow-Up Input

To complete exact dashboard pixel/component parity, provide the Dentira Dashboard Figma `/design/` URL with a `node-id`. The published Figma site and generated bundle are sufficient for implementation planning, but the original design node is still the cleanest source for exact responsive measurements.
