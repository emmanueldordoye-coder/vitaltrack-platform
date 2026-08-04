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
| Dashboard | Not yet provided as a `/design/` URL with `node-id` | Exact dashboard frame mapping remains pending. |

## Audit Constraint

The supplied Inventory Catalog reference is a Figma Make URL, not a regular Figma `/design/` frame URL. The Figma connector returned the Make application resource inventory, including page files and theme files, but did not expose readable source contents or a renderable screenshot through the available resource reader. The screenshot endpoint also rejected the Make root with `INVALID_ARGUMENT`, which is consistent with the screenshot tool supporting `/design/` nodes rather than Make files.

Because of that, this report separates:

- Confirmed production code, API, and seed-data facts.
- Confirmed Figma Make application structure from the connector response.
- Figma-to-production gaps that can be mapped from the Make app's exposed page/component inventory.
- Design-token and pixel-level details that still require a regular Figma `/design/` node URL or readable Make source contents.

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

## Inventory Catalog Figma-To-Production Map

This section maps the supplied Figma Make Inventory Catalog design to the validated production `/inventory` route. Pixel-level typography, colors, and spacing remain pending readable Make source contents or a normal Figma `/design/` node.

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
| Manufacturer part number column | Exists as `MPN` | Inventory table | `manufacturer_part_number` | Supported live data. |
| Location column | Exists | Inventory table | `location_name` from `locations.name` | Supported live data. |
| Quantity/current stock column | Exists as `Qty` | Inventory table | `current_quantity` | Supported live data. |
| Par level column | Exists as `Par` | Inventory table | `par_level` | Supported live data. |
| Reorder point column | Exists as `Reorder` | Inventory table | `reorder_point` | Supported live data. |
| Vendor/supplier column | Exists | Inventory table | `vendor_name`, resolved through Patterson vendor metadata | Supported live data. |
| Unit cost column | Exists | Inventory table | `unit_cost` from product metadata | Supported live data. |
| Stock status badge | Exists | Inventory table | `is_low_stock`, computed as `current_quantity <= reorder_point` | Supported computed value. |
| Search/filter control | Missing in UI | Backend supports `search` query | `GET /api/v1/inventory?search=` across product name, SKU, MPN | Demo-critical gap; no backend rebuild needed. |
| Category filter | Not currently wired in backend query | API schema accepts `category`, but Lighthouse read path currently ignores it | Category exists in Product Master Catalog seed, but current endpoint does not join/render it | Do not claim support until backend read path is updated. |
| Inventory summary cards | Missing on inventory page | Could be added from existing inventory response | Total rows, low-stock count, estimated stock value from `unit_cost * current_quantity` | Demo-safe if presented as derived from visible inventory rows, not analytics. |
| Suggested order CTA | Missing in production UI | Database RPC exists; no production API/UI workflow | Unsupported in live app today | Must not be enabled or implied in the Inventory Catalog demo unless a separate workflow slice is built. |
| Supplier integration / submit to Patterson | Not implemented | None | Vendor is mock Patterson data only | Unsupported; must remain static/mock language only. |
| Charts | Not present in production inventory page | None | No chart endpoint | Unsupported unless chart is static decorative content or derived transparently from visible rows. |
| Icons | Production currently uses text-only nav/table | None | Figma Make includes image assets and UI primitives, but exact glyphs were not readable | Required new visual assets/components only after design source or exported assets are accessible. |

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

Implementation should therefore map Figma tokens into the existing Tailwind theme only after the token source is readable or a `/design/` frame URL is supplied.

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
| Visual design | Generic stat cards and sparse layout | Match Figma dashboard composition | Demo-critical |
| Data honesty | Counts reflect live APIs | Avoid claiming unsupported suggested-order actions | Demo-critical |

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
7. Complete exact Figma audit once the Figma URL/node is available.

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

1. Obtain a regular Figma `/design/` dashboard frame URL with `node-id` if exact dashboard spacing, colors, icon glyphs, and responsive behavior are required.
2. Use the supplied Figma Make Inventory Catalog reference to align the `/inventory` shell/table direction without changing backend APIs.
3. Build a small Dentira demo shell layer on top of the existing authenticated layout: logo/brand treatment, workspace label, user display, and nav styling. Reuse the current routes.
4. Restyle Dashboard with existing data first: facilities count, inventory count, purchase-order count, and a derived low-stock count from the existing inventory response if the final dashboard design needs it.
5. Restyle Inventory and add search using the existing backend `search` query. Do not introduce a new endpoint.
6. Restyle Facilities and decide whether the current create form should be hidden for demo parity.
7. Restyle Purchase Orders with an honest empty state or seed-approved read-only demo rows. Do not imply ordering automation is live unless the suggested-order UI is implemented.
8. Only after the above is stable, start a separate pilot workflow ticket for suggested orders, approval, PO creation, and receiving UI.

## Estimated Effort

| Task | Estimate | Notes |
| --- | ---: | --- |
| Figma dashboard inspection and exact element inventory | 0.5 day | Requires dashboard `/design/` node URL. |
| Figma Make Inventory Catalog mapping | Complete | Make URL inspected; source file contents and screenshot were not readable from current connector response. |
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
- Use the supplied Figma Make Inventory Catalog reference as supporting direction for shell/table styling, but do not treat unsupported Make pages as live product scope.
- Use only existing metrics: facilities count, inventory count, purchase-order count, and optionally derived low-stock count from the existing inventory list.
- Keep copy honest: no AI, forecasting, supplier submission, receiving, barcode scanning, analytics, or ordering automation claims.

**Acceptance Criteria**:

- `/sign-in` and `/dashboard` visually match the supplied Dentira Figma screens within the existing app architecture.
- Authenticated browser validation still passes.
- Dashboard metrics remain backed by current APIs.
- No migrations, auth weakening, backend rebuild, or new product features are introduced.

## Required Follow-Up Input

To complete exact dashboard pixel/component parity, provide the Dentira Dashboard Figma `/design/` URL with a `node-id`. The supplied Inventory Catalog Figma Make URL is now mapped above, but its source contents and screenshot were not readable through the current connector response.
