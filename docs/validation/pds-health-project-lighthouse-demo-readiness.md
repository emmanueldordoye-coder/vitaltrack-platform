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
| Sign In | Pending staging validation | Copy now references PDS Health operations workspace. |
| Dashboard | Pending staging validation | Workspace labels are rendered as PDS Health while preserving live counts. |
| Inventory | Pending staging validation | Inventory rows remain separate from PO-backed catalog products. |
| Product Catalog | Pending staging validation | Catalog copy uses PDS Health framing and Dentira/Patterson provenance. |
| Draft PO | Pending staging validation | Draft POs remain internal to VitalTrack; supplier submission is explicitly disabled. |
| Purchase Orders | Pending staging validation | PTU317717 remains source-backed and distinct from demo-generated draft POs. |
| Sign Out | Pending staging validation | Existing auth/session flow is unchanged. |

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
- Staging URL: pending
- Staging deployment run: pending
- Production touched: no
