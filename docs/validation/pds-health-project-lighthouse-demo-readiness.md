# PDS Health Project Lighthouse Demo Readiness

## Scope

This document records the controlled MVP correction that reframes the validated Project Lighthouse demo for PDS Health while preserving Dentira and Patterson references where they represent source-backed purchasing evidence.

## Identity Boundary

- Customer-facing workspace: PDS Health Workspace
- Customer-facing demo site label: PDS Health pilot site
- Project language retained where appropriate: Project Lighthouse
- Source provenance preserved: Dentira/Patterson order evidence for PO PTU317717
- Internal fixture names preserved where required by seeds, tests, source artifacts, cleanup scripts, and validation SQL

## Preserved Source-Backed Facts

- Source-backed PO: PTU317717
- Order number: 6209555669
- Supplier: Patterson Dental Supply Inc
- Order date: Jun 12, 2026
- Line count: 42
- Ordered units: 63
- Total: USD 1,384.47
- Product Catalog rows: 42
- Inventory rows: 7

## Customer Path

| Step | Status | Notes |
| --- | --- | --- |
| Sign In | PASS | Copy references the PDS Health operations workspace and no incorrect Dentira-as-customer framing was observed. |
| Dashboard | PASS | Workspace labels render as PDS Health; live counts loaded without auth or server errors. |
| Inventory | PASS | Inventory remains 7 rows with 6 low-stock rows and 1 in-stock row; PO-backed catalog products did not appear as on-hand inventory. |
| Product Catalog | PASS | 42 source-backed catalog rows rendered with PDS Health framing and Dentira/Patterson provenance. Search passed for `gloves`, `Patterson`, and `NXTHG5002CR`. |
| Draft PO | PASS | Three catalog products were added to an internal VitalTrack draft; quantities were adjusted; the draft PO was created with supplier submission explicitly disabled. |
| Purchase Orders | PASS | PTU317717 remained source-backed and distinct from the demo-generated `VT-DRAFT-*` order. |
| Sign Out | PASS | Existing auth/session flow returned cleanly to the PDS Health sign-in page. |

## Unsupported Claims Intentionally Omitted

- Electronic submission to Dentira, Patterson, Staples, manufacturers, distributors, or suppliers
- Receiving completion
- Shipment tracking
- Delivery date guarantees
- Payment status
- Automated replenishment
- AI recommendations
- Savings, spend reduction, or ROI metrics
- Inventory on-hand quantities for PO-only products

## Audit Classification

- Customer identity references: corrected in the customer-facing frontend presentation.
- Source provenance references: preserved in source artifacts, validation SQL, PO copy, product thumbnail alt text, and image asset paths.
- Procurement-platform references: preserved only where they explain the Dentira/Patterson evidence boundary.
- Internal fixture references: preserved in seed/source data, test fixture IDs, cleanup SQL, docs, and backend/database validation.
- Unknown references: none identified in customer-facing application copy after the static scan.

## Validation Plan

- Run frontend type-check, lint, test, and build with safe preview environment values.
- Run backend type-check, lint, and tests to confirm no cross-workspace regression.
- Run `git diff --check`.
- Run customer-facing copy scan for incorrect Dentira-as-customer framing.
- Deploy to staging/preview only.
- Validate desktop and mobile customer path:
  Sign In -> Dashboard -> Inventory -> Product Catalog -> select products -> Create Draft PO -> Purchase Orders -> Sign Out.
- Confirm PTU317717, Product Catalog count, Inventory count, and draft PO cleanup baseline remain intact.

## Latest Validation

- Main SHA before correction: bcb984ced35636cbcbe79c53e9b169aefb0d67ab
- Correction branch: feat/pds-health-demo-framing
- Validated PR head: 13fb8be34218f18c341ab327b0879b103e3ae745
- Pull request: https://github.com/emmanueldordoye-coder/vitaltrack-platform/pull/24
- CI: passing
- Vercel Preview: passing
- Official staging deployment run: https://github.com/emmanueldordoye-coder/vitaltrack-platform/actions/runs/32758276580
- Staging deployment result: PASS
- Staging URL: https://vitaltrack-project-lighthouse-beurumhzx-vital-track-project.vercel.app
- Frontend SHA: 13fb8be34218f18c341ab327b0879b103e3ae745
- Backend SHA: 13fb8be34218f18c341ab327b0879b103e3ae745
- Vercel staging authentication: PASS after replacing the invalid GitHub staging environment `VERCEL_TOKEN` with a locally verified Vercel credential.
- Backend deploy validation: PASS; the staging smoke test waited until the Render backend reported the expected SHA before checking protected routes.
- Authenticated smoke token: skipped by workflow because `STAGING_SMOKE_TEST_TOKEN` is expired; browser validation was completed through manual authenticated staging access.
- Production touched: no

## Browser Validation Results

| Check | Result | Evidence |
| --- | --- | --- |
| PDS Health customer identity | PASS | Sign-in, shell, Dashboard, Inventory, Product Catalog, and Purchase Orders showed PDS Health / PDS Health Workspace framing. |
| Dentira provenance | PASS | Dentira/Patterson references remained only as source-backed purchasing evidence and procurement context. |
| Dashboard | PASS | PDS Health Workspace loaded with 1 facility, 7 inventory rows, 6 low-stock items, and purchase-order counts reflecting the temporary draft during rehearsal. |
| Inventory | PASS | 7 validated inventory rows remained separate from PO-backed catalog data; no `VT-DRAFT-*` or PO-only catalog products appeared as inventory. |
| Low-stock visibility | PASS | 6 low-stock rows and 1 in-stock row rendered from current inventory data. |
| Product Catalog | PASS | 42 catalog rows rendered from Dentira/Patterson purchasing evidence. Representative searches returned expected results. |
| Product thumbnails | PASS | 42 thumbnail image elements were present. A representative signed-in asset request returned `image/png`; direct unauthenticated `curl` was blocked by Vercel protection and was not used as image evidence. |
| Draft PO | PASS | Created `VT-DRAFT-20260824-9390490E` from three catalog products with adjusted quantities. Success copy stated the draft was created inside VitalTrack and supplier submission is not enabled. |
| Purchase Orders | PASS | `VT-DRAFT-20260824-9390490E` appeared as Draft with 3 lines, 6 units, and USD 50.99 during rehearsal. PTU317717 remained present with 42 lines, 63 units, and USD 1,384.47. |
| Sign Out | PASS | Sign-out returned to `/sign-in` with PDS Health sign-in copy. |
| Console errors | PASS | Browser console log check returned no errors. |
| Server errors | PASS | No server-side exceptions were observed in the browser path or staging deploy smoke logs. |

## Post-Rehearsal Cleanup

- Rehearsal draft created: `VT-DRAFT-20260824-9390490E`
- Cleanup method: existing approved VitalTrack-Staging SQL cleanup script run manually in Supabase SQL Editor.
- Cleanup confirmation: manually confirmed after the cleanup run that `PTU317717` remains and `VT-DRAFT-20260824-9390490E` is gone.
- Final expected baseline:
  - PTU317717 preserved
  - Product Catalog rows preserved: 42
  - Inventory rows preserved: 7
  - Rehearsal `VT-DRAFT-*` orders: 0

## GO / NO-GO

GO for the PDS Health / Dentira Project Lighthouse demo path on staging.
