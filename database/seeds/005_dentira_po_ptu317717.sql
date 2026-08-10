-- Dentira PO PTU317717 purchasing/catalog seed
-- Source: database/sources/dentira_po_ptu317717.json
-- Purpose: Load real Dentira purchasing evidence without creating inventory levels.
--
-- Data boundary:
-- This seed proves purchasing and product catalog facts only. It intentionally
-- does not create inventory_levels, par levels, reorder points, storage
-- locations, receiving events, approval events, delivery status, savings, or
-- usage velocity.

BEGIN;

DO $$
DECLARE
  line_count INTEGER;
  ordered_units NUMERIC;
  order_total NUMERIC;
BEGIN
  WITH source_lines AS (
    SELECT *
    FROM (
      VALUES
    (1, 'Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854', 'Braval Nitrile PF Exam Gloves, Lavender Blue, Small', 'Braval', '070367854', 2, 7.83, 15.66, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":1,"raw_product_description":"Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854","normalized_product_name":"Braval Nitrile PF Exam Gloves, Lavender Blue, Small","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"070367854","unit_cost":7.83,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (2, 'Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Medium 300/Pkg | Braval | 070367862', 'Braval Nitrile PF Exam Gloves, Lavender Blue, Medium', 'Braval', '070367862', 4, 7.83, 31.32, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":2,"raw_product_description":"Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Medium 300/Pkg | Braval | 070367862","normalized_product_name":"Braval Nitrile PF Exam Gloves, Lavender Blue, Medium","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"070367862","unit_cost":7.83,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (3, 'TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window 100/Pkg Ultradent Valo | Tidi | 21105', 'TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window', 'Tidi', '21105', 1, 11.84, 11.84, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":3,"raw_product_description":"TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window 100/Pkg Ultradent Valo | Tidi | 21105","normalized_product_name":"TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window","brand_or_manufacturer":"Tidi","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"21105","unit_cost":11.84,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (4, 'Patterson Topical Anesthetic Gel 1 oz Strawberry | Patterson Dental Supply | 0327019', 'Patterson Topical Anesthetic Gel 1 oz Strawberry', 'Patterson Dental Supply', '0327019', 5, 1.72, 8.60, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":4,"raw_product_description":"Patterson Topical Anesthetic Gel 1 oz Strawberry | Patterson Dental Supply | 0327019","normalized_product_name":"Patterson Topical Anesthetic Gel 1 oz Strawberry","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0327019","unit_cost":1.72,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (5, 'HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm | Surgical Esthetics | HACOLLP', 'HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm', 'Surgical Esthetics', 'HACOLLP', 2, 82.87, 165.74, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":5,"raw_product_description":"HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm | Surgical Esthetics | HACOLLP","normalized_product_name":"HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm","brand_or_manufacturer":"Surgical Esthetics","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"HACOLLP","unit_cost":82.87,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (6, 'Patterson High Performance (HP) Bite Registration Flavored Fast Set Mint | Patterson Dental Supply | 0842997', 'Patterson High Performance Bite Registration Fast Set Mint', 'Patterson Dental Supply', '0842997', 1, 14.39, 14.39, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":6,"raw_product_description":"Patterson High Performance (HP) Bite Registration Flavored Fast Set Mint | Patterson Dental Supply | 0842997","normalized_product_name":"Patterson High Performance Bite Registration Fast Set Mint","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0842997","unit_cost":14.39,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (7, 'Patterson Lidocaine Anesthetic HCl 2% with Epinephrine – 1.7 ml Cartridges 50/Pkg 1:100 000 | Patterson Dental Supply | 05A0100', 'Patterson Lidocaine Anesthetic HCl 2% with Epinephrine', 'Patterson Dental Supply', '05A0100', 1, 29.77, 29.77, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":7,"raw_product_description":"Patterson Lidocaine Anesthetic HCl 2% with Epinephrine – 1.7 ml Cartridges 50/Pkg 1:100 000 | Patterson Dental Supply | 05A0100","normalized_product_name":"Patterson Lidocaine Anesthetic HCl 2% with Epinephrine","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05A0100","unit_cost":29.77,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (8, 'Solmetex NXT Hg5 Collection Container With Recycle Kit Ea | Solmetex | NXTHG5002CR', 'Solmetex NXT Hg5 Collection Container With Recycle Kit', 'Solmetex', 'NXTHG5002CR', 1, 299.99, 299.99, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":8,"raw_product_description":"Solmetex NXT Hg5 Collection Container With Recycle Kit Ea | Solmetex | NXTHG5002CR","normalized_product_name":"Solmetex NXT Hg5 Collection Container With Recycle Kit","brand_or_manufacturer":"Solmetex","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"NXTHG5002CR","unit_cost":299.99,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (9, 'Patterson Surgical Aspirator Tips 25/Pkg Large 1/4" Tip Green | Patterson Dental Supply | 082225', 'Patterson Surgical Aspirator Tips Large 1/4 Inch Green', 'Patterson Dental Supply', '082225', 2, 2.03, 4.06, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":9,"raw_product_description":"Patterson Surgical Aspirator Tips 25/Pkg Large 1/4\" Tip Green | Patterson Dental Supply | 082225","normalized_product_name":"Patterson Surgical Aspirator Tips Large 1/4 Inch Green","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"082225","unit_cost":2.03,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (10, 'Patterson Saliva Ejectors 100/Pkg Clear with Blue Tip | Patterson Dental Supply | 1073964', 'Patterson Saliva Ejectors Clear with Blue Tip', 'Patterson Dental Supply', '1073964', 3, 2.00, 6.00, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":10,"raw_product_description":"Patterson Saliva Ejectors 100/Pkg Clear with Blue Tip | Patterson Dental Supply | 1073964","normalized_product_name":"Patterson Saliva Ejectors Clear with Blue Tip","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1073964","unit_cost":2,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (11, 'Patterson Cotton-Tipped Applicators – 100/Bag 10 Bags/Box 3" | Patterson Dental Supply | 1074004', 'Patterson Cotton-Tipped Applicators 3 Inch', 'Patterson Dental Supply', '1074004', 2, 2.55, 5.10, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":11,"raw_product_description":"Patterson Cotton-Tipped Applicators – 100/Bag 10 Bags/Box 3\" | Patterson Dental Supply | 1074004","normalized_product_name":"Patterson Cotton-Tipped Applicators 3 Inch","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1074004","unit_cost":2.55,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (12, 'Patterson Lead-Free Autoclave Indicator Tape 1" W x 60 Yards L | Patterson Dental Supply | STLF24MMP', 'Patterson Lead-Free Autoclave Indicator Tape', 'Patterson Dental Supply', 'STLF24MMP', 1, 4.94, 4.94, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":12,"raw_product_description":"Patterson Lead-Free Autoclave Indicator Tape 1\" W x 60 Yards L | Patterson Dental Supply | STLF24MMP","normalized_product_name":"Patterson Lead-Free Autoclave Indicator Tape","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"STLF24MMP","unit_cost":4.94,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (13, 'Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A2 Low Translucency | GC America | 012932', 'Initial LiSi CAD/CAM Blocks Size 14 Shade A2 Low Translucency', 'GC America', '012932', 1, 82.92, 82.92, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":13,"raw_product_description":"Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A2 Low Translucency | GC America | 012932","normalized_product_name":"Initial LiSi CAD/CAM Blocks Size 14 Shade A2 Low Translucency","brand_or_manufacturer":"GC America","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"012932","unit_cost":82.92,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (14, 'Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A3 Low Translucency | GC America | 012933', 'Initial LiSi CAD/CAM Blocks Size 14 Shade A3 Low Translucency', 'GC America', '012933', 1, 82.92, 82.92, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":14,"raw_product_description":"Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A3 Low Translucency | GC America | 012933","normalized_product_name":"Initial LiSi CAD/CAM Blocks Size 14 Shade A3 Low Translucency","brand_or_manufacturer":"GC America","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"012933","unit_cost":82.92,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (15, 'Braval Earloop Face Masks – Latex Free 50/Pkg ASTM Level 3 Teal | Braval | 1446269', 'Braval Earloop Face Masks ASTM Level 3 Teal', 'Braval', '1446269', 3, 1.86, 5.58, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":15,"raw_product_description":"Braval Earloop Face Masks – Latex Free 50/Pkg ASTM Level 3 Teal | Braval | 1446269","normalized_product_name":"Braval Earloop Face Masks ASTM Level 3 Teal","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1446269","unit_cost":1.86,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (16, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #1 Large Upper | Braval | 071446467', 'Braval Perforated Disposable Impression Trays Blue #1 Large Upper', 'Braval', '071446467', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":16,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #1 Large Upper | Braval | 071446467","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #1 Large Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446467","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (17, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #2 Large Lower | Braval | 071446475', 'Braval Perforated Disposable Impression Trays Blue #2 Large Lower', 'Braval', '071446475', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":17,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #2 Large Lower | Braval | 071446475","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #2 Large Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446475","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (18, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #3 Medium Upper | Braval | 071446483', 'Braval Perforated Disposable Impression Trays Blue #3 Medium Upper', 'Braval', '071446483', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":18,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #3 Medium Upper | Braval | 071446483","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #3 Medium Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446483","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (19, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #4 Medium Lower | Braval | 071446491', 'Braval Perforated Disposable Impression Trays Blue #4 Medium Lower', 'Braval', '071446491', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":19,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #4 Medium Lower | Braval | 071446491","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #4 Medium Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446491","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (20, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #5 Small Upper | Braval | 071446509', 'Braval Perforated Disposable Impression Trays Blue #5 Small Upper', 'Braval', '071446509', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":20,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #5 Small Upper | Braval | 071446509","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #5 Small Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446509","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (21, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #6 Small Lower | Braval | 071446517', 'Braval Perforated Disposable Impression Trays Blue #6 Small Lower', 'Braval', '071446517', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":21,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #6 Small Lower | Braval | 071446517","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #6 Small Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446517","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (22, 'Polybite Disposable Bite Trays Posterior Tray 50/Pkg | Dentamerica | 886', 'Polybite Disposable Bite Trays Posterior Tray', 'Dentamerica', '886', 1, 13.68, 13.68, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":22,"raw_product_description":"Polybite Disposable Bite Trays Posterior Tray 50/Pkg | Dentamerica | 886","normalized_product_name":"Polybite Disposable Bite Trays Posterior Tray","brand_or_manufacturer":"Dentamerica","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"886","unit_cost":13.68,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (23, 'CaviWipes Disinfecting Towelettes Large 6” x 6.75” (160/tub) | KaVo Kerr | 131100', 'CaviWipes Disinfecting Towelettes Large', 'KaVo Kerr', '131100', 3, 4.67, 14.01, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":23,"raw_product_description":"CaviWipes Disinfecting Towelettes Large 6” x 6.75” (160/tub) | KaVo Kerr | 131100","normalized_product_name":"CaviWipes Disinfecting Towelettes Large","brand_or_manufacturer":"KaVo Kerr","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"131100","unit_cost":4.67,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (24, 'Probes – # 15 UNC Rung Black Single End Standard Handle | American Eagle | AEPUNC15RB', 'Probes #15 UNC Rung Black Single End Standard Handle', 'American Eagle', 'AEPUNC15RB', 2, 16.43, 32.86, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":24,"raw_product_description":"Probes – # 15 UNC Rung Black Single End Standard Handle | American Eagle | AEPUNC15RB","normalized_product_name":"Probes #15 UNC Rung Black Single End Standard Handle","brand_or_manufacturer":"American Eagle","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"AEPUNC15RB","unit_cost":16.43,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (25, '0.9% Sodium Chloride Injection USP - 500 ml 2 Port 18/Pkg NDC 00409-7983-55 | ICU Medical Inc | 0798355', '0.9% Sodium Chloride Injection USP 500 ml 2 Port', 'ICU Medical Inc', '0798355', 1, 87.93, 87.93, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":25,"raw_product_description":"0.9% Sodium Chloride Injection USP - 500 ml 2 Port 18/Pkg NDC 00409-7983-55 | ICU Medical Inc | 0798355","normalized_product_name":"0.9% Sodium Chloride Injection USP 500 ml 2 Port","brand_or_manufacturer":"ICU Medical Inc","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0798355","unit_cost":87.93,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (26, 'Surgical Blades – Stainless Steel Sterile 100/Box 15 | Miltex by Integra | 4315', 'Surgical Blades Stainless Steel Sterile #15', 'Miltex by Integra', '4315', 1, 33.05, 33.05, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":26,"raw_product_description":"Surgical Blades – Stainless Steel Sterile 100/Box 15 | Miltex by Integra | 4315","normalized_product_name":"Surgical Blades Stainless Steel Sterile #15","brand_or_manufacturer":"Miltex by Integra","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"4315","unit_cost":33.05,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (27, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Monophase Regular Set 2 Cartridges | 3M | 5312', 'Paradigm VPS Impression Material Cartridge Refill Monophase Regular Set', '3M', '5312', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":27,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Monophase Regular Set 2 Cartridges | 3M | 5312","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Monophase Regular Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"5312","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (28, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Light Body Fast Set 2 Cartridges | 3M | 05511', 'Paradigm VPS Impression Material Cartridge Refill Light Body Fast Set', '3M', '05511', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":28,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Light Body Fast Set 2 Cartridges | 3M | 05511","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Light Body Fast Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05511","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (29, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Heavy Body Fast Set 2 Cartridges | 3M | 05513', 'Paradigm VPS Impression Material Cartridge Refill Heavy Body Fast Set', '3M', '05513', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":29,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Heavy Body Fast Set 2 Cartridges | 3M | 05513","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Heavy Body Fast Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05513","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (30, 'Evac-u-Trap 2350-FS Disposable Canister – Internal Thread Fine Mesh 3-1/2" x 4-3/8" 8/Pkg | KaVo Kerr | 2350FS', 'Evac-u-Trap 2350-FS Disposable Canister Internal Thread Fine Mesh', 'KaVo Kerr', '2350FS', 1, 69.65, 69.65, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":30,"raw_product_description":"Evac-u-Trap 2350-FS Disposable Canister – Internal Thread Fine Mesh 3-1/2\" x 4-3/8\" 8/Pkg | KaVo Kerr | 2350FS","normalized_product_name":"Evac-u-Trap 2350-FS Disposable Canister Internal Thread Fine Mesh","brand_or_manufacturer":"KaVo Kerr","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"2350FS","unit_cost":69.65,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (31, 'Hemodent Hemostatic Solution 20 cc Bottle | Premier | 9007072', 'Hemodent Hemostatic Solution 20 cc Bottle', 'Premier', '9007072', 1, 22.55, 22.55, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":31,"raw_product_description":"Hemodent Hemostatic Solution 20 cc Bottle | Premier | 9007072","normalized_product_name":"Hemodent Hemostatic Solution 20 cc Bottle","brand_or_manufacturer":"Premier","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"9007072","unit_cost":22.55,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (32, 'Cord Packer Instruments – Sherman Packer Double End Smooth | Premier | 1003578', 'Cord Packer Instruments Sherman Packer Double End Smooth', 'Premier', '1003578', 2, 18.86, 37.72, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":32,"raw_product_description":"Cord Packer Instruments – Sherman Packer Double End Smooth | Premier | 1003578","normalized_product_name":"Cord Packer Instruments Sherman Packer Double End Smooth","brand_or_manufacturer":"Premier","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1003578","unit_cost":18.86,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (33, 'Seal-Tight Spectrum Disposable Air/Water Syringe Tips 200/Pkg | Kerr TotalCare (Pinnacle) | 72200', 'Seal-Tight Spectrum Disposable Air/Water Syringe Tips', 'Kerr TotalCare (Pinnacle)', '72200', 2, 24.04, 48.08, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":33,"raw_product_description":"Seal-Tight Spectrum Disposable Air/Water Syringe Tips 200/Pkg | Kerr TotalCare (Pinnacle) | 72200","normalized_product_name":"Seal-Tight Spectrum Disposable Air/Water Syringe Tips","brand_or_manufacturer":"Kerr TotalCare (Pinnacle)","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"72200","unit_cost":24.04,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (34, 'Septocaine 4% Articaine HCl with Epinephrine – 1.7 ml Injection Cartridges 50/Pkg Epinephrine 1:100 000 | Septodont | 01A1400', 'Septocaine 4% Articaine HCl with Epinephrine', 'Septodont', '01A1400', 1, 40.50, 40.50, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":34,"raw_product_description":"Septocaine 4% Articaine HCl with Epinephrine – 1.7 ml Injection Cartridges 50/Pkg Epinephrine 1:100 000 | Septodont | 01A1400","normalized_product_name":"Septocaine 4% Articaine HCl with Epinephrine","brand_or_manufacturer":"Septodont","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"01A1400","unit_cost":40.5,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (35, 'Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard | SDI | 7510102', 'Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard', 'SDI', '7510102', 1, 12.55, 12.55, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":35,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard | SDI | 7510102","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"7510102","unit_cost":12.55,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (36, 'Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal | SDI | 7510203', 'Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal', 'SDI', '7510203', 1, 12.55, 12.55, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":36,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal | SDI | 7510203","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"7510203","unit_cost":12.55,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (37, 'Monoject 412 Curved Syringe Disposable 50/Box | Cardinal | 8881412012', 'Monoject 412 Curved Syringe Disposable', 'Cardinal', '8881412012', 1, 20.31, 20.31, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":37,"raw_product_description":"Monoject 412 Curved Syringe Disposable 50/Box | Cardinal | 8881412012","normalized_product_name":"Monoject 412 Curved Syringe Disposable","brand_or_manufacturer":"Cardinal","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"8881412012","unit_cost":20.31,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (38, 'Wave Flowable Composite 1 g Syringe Refill Wave HV A3 | SDI | 8210304', 'Wave Flowable Composite 1 g Syringe Refill Wave HV A3', 'SDI', '8210304', 1, 12.63, 12.63, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":38,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave HV A3 | SDI | 8210304","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave HV A3","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"8210304","unit_cost":12.63,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (39, 'Look Suture 4-0 18" Chromic Gut Monofilament C-6 Undyed Beige 12/Bx | Surgical Specialties | 558B', 'Look Suture 4-0 Chromic Gut Monofilament C-6 Undyed Beige', 'Surgical Specialties', '558B', 1, 27.26, 27.26, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":39,"raw_product_description":"Look Suture 4-0 18\" Chromic Gut Monofilament C-6 Undyed Beige 12/Bx | Surgical Specialties | 558B","normalized_product_name":"Look Suture 4-0 Chromic Gut Monofilament C-6 Undyed Beige","brand_or_manufacturer":"Surgical Specialties","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"558B","unit_cost":27.26,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (40, 'Waste Stick-On Bags – Red Biohazard 100/Pkg 9" x 10" 1.4 Quart | Unimed | CTRB042910', 'Waste Stick-On Bags Red Biohazard', 'Unimed', 'CTRB042910', 2, 23.68, 47.36, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":40,"raw_product_description":"Waste Stick-On Bags – Red Biohazard 100/Pkg 9\" x 10\" 1.4 Quart | Unimed | CTRB042910","normalized_product_name":"Waste Stick-On Bags Red Biohazard","brand_or_manufacturer":"Unimed","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"CTRB042910","unit_cost":23.68,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (41, 'Profluorid 5% Sodium Fluoride Varnish Single Dose Mint 0.4 ml Adult 50/Pkg | Voco | 2228', 'Profluorid 5% Sodium Fluoride Varnish Single Dose Mint', 'Voco', '2228', 1, 30.11, 30.11, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":41,"raw_product_description":"Profluorid 5% Sodium Fluoride Varnish Single Dose Mint 0.4 ml Adult 50/Pkg | Voco | 2228","normalized_product_name":"Profluorid 5% Sodium Fluoride Varnish Single Dose Mint","brand_or_manufacturer":"Voco","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"2228","unit_cost":30.11,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (42, 'Reli Disposable Safety Retractor Scalpel #15 Plastic/Stainless Steel Sterile | Myco | 6008TR15', 'Reli Disposable Safety Retractor Scalpel #15 Sterile', 'Myco', '6008TR15', 1, 13.75, 13.75, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":42,"raw_product_description":"Reli Disposable Safety Retractor Scalpel #15 Plastic/Stainless Steel Sterile | Myco | 6008TR15","normalized_product_name":"Reli Disposable Safety Retractor Scalpel #15 Sterile","brand_or_manufacturer":"Myco","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"6008TR15","unit_cost":13.75,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb)
    ) AS line(
      source_line_number,
      raw_product_description,
      normalized_product_name,
      brand_or_manufacturer,
      vendor_item_number,
      quantity_ordered,
      unit_price,
      calculated_line_total,
      image_present,
      source_screenshot,
      source_page,
      metadata
    )
  )
  SELECT
    COUNT(*),
    SUM(quantity_ordered),
    SUM(calculated_line_total)
  INTO line_count, ordered_units, order_total
  FROM source_lines;

  IF line_count <> 42 OR ordered_units <> 63 OR order_total <> 1384.47 THEN
    RAISE EXCEPTION 'Dentira PO PTU317717 source reconciliation failed: lines %, units %, total %',
      line_count, ordered_units, order_total;
  END IF;
END $$;

INSERT INTO suppliers (
  id,
  organization_id,
  name,
  supplier_code,
  website,
  payment_terms,
  is_active,
  metadata
)
VALUES (
  'd4100000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Patterson Dental Supply Inc',
  'PATTERSON_DENTAL_SUPPLY_INC',
  'https://www.pattersondental.com',
  NULL,
  TRUE,
  '{"source":"dentira_po_ptu317717","source_supplier_text":"PATTERSON DENTAL SUPPLY INC"}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  supplier_code = EXCLUDED.supplier_code,
  website = EXCLUDED.website,
  payment_terms = EXCLUDED.payment_terms,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO vendors (
  id,
  organization_id,
  name,
  vendor_code,
  website,
  payment_terms,
  is_active,
  metadata
)
VALUES (
  'd4110000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Patterson Dental Supply Inc',
  'PATTERSON_DENTAL_SUPPLY_INC',
  'https://www.pattersondental.com',
  NULL,
  TRUE,
  '{"source":"dentira_po_ptu317717","source_supplier_text":"PATTERSON DENTAL SUPPLY INC"}'::jsonb
)
ON CONFLICT (organization_id, vendor_code) DO UPDATE
SET
  name = EXCLUDED.name,
  website = EXCLUDED.website,
  payment_terms = EXCLUDED.payment_terms,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO units_of_measure (
  organization_id,
  base_unit_id,
  code,
  name,
  description,
  dimension,
  allows_decimal,
  is_base_unit,
  conversion_factor,
  metadata
)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  NULL,
  'order-unit',
  'Order Unit',
  'Unit used for purchase-order quantities when the source line does not provide a normalized stocking unit.',
  'count',
  FALSE,
  TRUE,
  1,
  '{"source":"dentira_po_ptu317717","inventory_data_boundary":"Do not treat this as a stocked unit of measure without Dentira inventory data."}'::jsonb
)
ON CONFLICT (organization_id, code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  dimension = EXCLUDED.dimension,
  allows_decimal = EXCLUDED.allows_decimal,
  is_base_unit = EXCLUDED.is_base_unit,
  conversion_factor = EXCLUDED.conversion_factor,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (
  organization_id,
  parent_category_id,
  name,
  slug,
  category_code,
  description,
  sort_order,
  is_active,
  metadata
)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  NULL,
  'Purchase Order Catalog Items',
  'purchase-order-catalog-items',
  'DENT-PO-CATALOG',
  'Catalog products loaded from Dentira purchase-order evidence without inventory quantities.',
  90,
  TRUE,
  '{"source":"dentira_po_ptu317717","derived_grouping":true}'::jsonb
)
ON CONFLICT (organization_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  category_code = EXCLUDED.category_code,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

WITH manufacturer_seed(name, manufacturer_code, metadata) AS (
  VALUES
  ('Braval', 'BRAVAL', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Tidi', 'TIDI', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Patterson Dental Supply', 'PATTERSON_DENTAL_SUPPLY', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Surgical Esthetics', 'SURGICAL_ESTHETICS', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Solmetex', 'SOLMETEX', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('GC America', 'GC_AMERICA', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Dentamerica', 'DENTAMERICA', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('KaVo Kerr', 'KAVO_KERR', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('American Eagle', 'AMERICAN_EAGLE', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('ICU Medical Inc', 'ICU_MEDICAL_INC', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Miltex by Integra', 'MILTEX_BY_INTEGRA', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('3M', '3M', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Premier', 'PREMIER', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Kerr TotalCare (Pinnacle)', 'KERR_TOTALCARE_PINNACLE', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Septodont', 'SEPTODONT', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('SDI', 'SDI', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Cardinal', 'CARDINAL', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Surgical Specialties', 'SURGICAL_SPECIALTIES', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Unimed', 'UNIMED', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Voco', 'VOCO', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb),
  ('Myco', 'MYCO', '{"source":"dentira_po_ptu317717","source_supplier":"PATTERSON DENTAL SUPPLY INC"}'::jsonb)
)
INSERT INTO manufacturers (
  organization_id,
  name,
  manufacturer_code,
  is_active,
  metadata
)
SELECT
  'd0000000-0000-0000-0000-000000000001',
  name,
  manufacturer_code,
  TRUE,
  metadata
FROM manufacturer_seed
ON CONFLICT (organization_id, manufacturer_code) DO UPDATE
SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

WITH source_lines AS (
  SELECT *
  FROM (
    VALUES
    (1, 'Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854', 'Braval Nitrile PF Exam Gloves, Lavender Blue, Small', 'Braval', '070367854', 2, 7.83, 15.66, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":1,"raw_product_description":"Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854","normalized_product_name":"Braval Nitrile PF Exam Gloves, Lavender Blue, Small","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"070367854","unit_cost":7.83,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (2, 'Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Medium 300/Pkg | Braval | 070367862', 'Braval Nitrile PF Exam Gloves, Lavender Blue, Medium', 'Braval', '070367862', 4, 7.83, 31.32, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":2,"raw_product_description":"Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Medium 300/Pkg | Braval | 070367862","normalized_product_name":"Braval Nitrile PF Exam Gloves, Lavender Blue, Medium","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"070367862","unit_cost":7.83,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (3, 'TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window 100/Pkg Ultradent Valo | Tidi | 21105', 'TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window', 'Tidi', '21105', 1, 11.84, 11.84, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":3,"raw_product_description":"TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window 100/Pkg Ultradent Valo | Tidi | 21105","normalized_product_name":"TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window","brand_or_manufacturer":"Tidi","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"21105","unit_cost":11.84,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (4, 'Patterson Topical Anesthetic Gel 1 oz Strawberry | Patterson Dental Supply | 0327019', 'Patterson Topical Anesthetic Gel 1 oz Strawberry', 'Patterson Dental Supply', '0327019', 5, 1.72, 8.60, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":4,"raw_product_description":"Patterson Topical Anesthetic Gel 1 oz Strawberry | Patterson Dental Supply | 0327019","normalized_product_name":"Patterson Topical Anesthetic Gel 1 oz Strawberry","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0327019","unit_cost":1.72,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (5, 'HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm | Surgical Esthetics | HACOLLP', 'HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm', 'Surgical Esthetics', 'HACOLLP', 2, 82.87, 165.74, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":5,"raw_product_description":"HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm | Surgical Esthetics | HACOLLP","normalized_product_name":"HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm","brand_or_manufacturer":"Surgical Esthetics","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"HACOLLP","unit_cost":82.87,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (6, 'Patterson High Performance (HP) Bite Registration Flavored Fast Set Mint | Patterson Dental Supply | 0842997', 'Patterson High Performance Bite Registration Fast Set Mint', 'Patterson Dental Supply', '0842997', 1, 14.39, 14.39, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":6,"raw_product_description":"Patterson High Performance (HP) Bite Registration Flavored Fast Set Mint | Patterson Dental Supply | 0842997","normalized_product_name":"Patterson High Performance Bite Registration Fast Set Mint","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0842997","unit_cost":14.39,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (7, 'Patterson Lidocaine Anesthetic HCl 2% with Epinephrine – 1.7 ml Cartridges 50/Pkg 1:100 000 | Patterson Dental Supply | 05A0100', 'Patterson Lidocaine Anesthetic HCl 2% with Epinephrine', 'Patterson Dental Supply', '05A0100', 1, 29.77, 29.77, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":7,"raw_product_description":"Patterson Lidocaine Anesthetic HCl 2% with Epinephrine – 1.7 ml Cartridges 50/Pkg 1:100 000 | Patterson Dental Supply | 05A0100","normalized_product_name":"Patterson Lidocaine Anesthetic HCl 2% with Epinephrine","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05A0100","unit_cost":29.77,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (8, 'Solmetex NXT Hg5 Collection Container With Recycle Kit Ea | Solmetex | NXTHG5002CR', 'Solmetex NXT Hg5 Collection Container With Recycle Kit', 'Solmetex', 'NXTHG5002CR', 1, 299.99, 299.99, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":8,"raw_product_description":"Solmetex NXT Hg5 Collection Container With Recycle Kit Ea | Solmetex | NXTHG5002CR","normalized_product_name":"Solmetex NXT Hg5 Collection Container With Recycle Kit","brand_or_manufacturer":"Solmetex","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"NXTHG5002CR","unit_cost":299.99,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (9, 'Patterson Surgical Aspirator Tips 25/Pkg Large 1/4" Tip Green | Patterson Dental Supply | 082225', 'Patterson Surgical Aspirator Tips Large 1/4 Inch Green', 'Patterson Dental Supply', '082225', 2, 2.03, 4.06, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":9,"raw_product_description":"Patterson Surgical Aspirator Tips 25/Pkg Large 1/4\" Tip Green | Patterson Dental Supply | 082225","normalized_product_name":"Patterson Surgical Aspirator Tips Large 1/4 Inch Green","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"082225","unit_cost":2.03,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (10, 'Patterson Saliva Ejectors 100/Pkg Clear with Blue Tip | Patterson Dental Supply | 1073964', 'Patterson Saliva Ejectors Clear with Blue Tip', 'Patterson Dental Supply', '1073964', 3, 2.00, 6.00, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":10,"raw_product_description":"Patterson Saliva Ejectors 100/Pkg Clear with Blue Tip | Patterson Dental Supply | 1073964","normalized_product_name":"Patterson Saliva Ejectors Clear with Blue Tip","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1073964","unit_cost":2,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (11, 'Patterson Cotton-Tipped Applicators – 100/Bag 10 Bags/Box 3" | Patterson Dental Supply | 1074004', 'Patterson Cotton-Tipped Applicators 3 Inch', 'Patterson Dental Supply', '1074004', 2, 2.55, 5.10, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":11,"raw_product_description":"Patterson Cotton-Tipped Applicators – 100/Bag 10 Bags/Box 3\" | Patterson Dental Supply | 1074004","normalized_product_name":"Patterson Cotton-Tipped Applicators 3 Inch","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1074004","unit_cost":2.55,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (12, 'Patterson Lead-Free Autoclave Indicator Tape 1" W x 60 Yards L | Patterson Dental Supply | STLF24MMP', 'Patterson Lead-Free Autoclave Indicator Tape', 'Patterson Dental Supply', 'STLF24MMP', 1, 4.94, 4.94, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":12,"raw_product_description":"Patterson Lead-Free Autoclave Indicator Tape 1\" W x 60 Yards L | Patterson Dental Supply | STLF24MMP","normalized_product_name":"Patterson Lead-Free Autoclave Indicator Tape","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"STLF24MMP","unit_cost":4.94,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (13, 'Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A2 Low Translucency | GC America | 012932', 'Initial LiSi CAD/CAM Blocks Size 14 Shade A2 Low Translucency', 'GC America', '012932', 1, 82.92, 82.92, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":13,"raw_product_description":"Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A2 Low Translucency | GC America | 012932","normalized_product_name":"Initial LiSi CAD/CAM Blocks Size 14 Shade A2 Low Translucency","brand_or_manufacturer":"GC America","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"012932","unit_cost":82.92,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (14, 'Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A3 Low Translucency | GC America | 012933', 'Initial LiSi CAD/CAM Blocks Size 14 Shade A3 Low Translucency', 'GC America', '012933', 1, 82.92, 82.92, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":14,"raw_product_description":"Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A3 Low Translucency | GC America | 012933","normalized_product_name":"Initial LiSi CAD/CAM Blocks Size 14 Shade A3 Low Translucency","brand_or_manufacturer":"GC America","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"012933","unit_cost":82.92,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (15, 'Braval Earloop Face Masks – Latex Free 50/Pkg ASTM Level 3 Teal | Braval | 1446269', 'Braval Earloop Face Masks ASTM Level 3 Teal', 'Braval', '1446269', 3, 1.86, 5.58, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":15,"raw_product_description":"Braval Earloop Face Masks – Latex Free 50/Pkg ASTM Level 3 Teal | Braval | 1446269","normalized_product_name":"Braval Earloop Face Masks ASTM Level 3 Teal","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1446269","unit_cost":1.86,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (16, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #1 Large Upper | Braval | 071446467', 'Braval Perforated Disposable Impression Trays Blue #1 Large Upper', 'Braval', '071446467', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":16,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #1 Large Upper | Braval | 071446467","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #1 Large Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446467","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (17, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #2 Large Lower | Braval | 071446475', 'Braval Perforated Disposable Impression Trays Blue #2 Large Lower', 'Braval', '071446475', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":17,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #2 Large Lower | Braval | 071446475","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #2 Large Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446475","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (18, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #3 Medium Upper | Braval | 071446483', 'Braval Perforated Disposable Impression Trays Blue #3 Medium Upper', 'Braval', '071446483', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":18,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #3 Medium Upper | Braval | 071446483","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #3 Medium Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446483","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (19, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #4 Medium Lower | Braval | 071446491', 'Braval Perforated Disposable Impression Trays Blue #4 Medium Lower', 'Braval', '071446491', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":19,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #4 Medium Lower | Braval | 071446491","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #4 Medium Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446491","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (20, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #5 Small Upper | Braval | 071446509', 'Braval Perforated Disposable Impression Trays Blue #5 Small Upper', 'Braval', '071446509', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":20,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #5 Small Upper | Braval | 071446509","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #5 Small Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446509","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (21, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #6 Small Lower | Braval | 071446517', 'Braval Perforated Disposable Impression Trays Blue #6 Small Lower', 'Braval', '071446517', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":21,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #6 Small Lower | Braval | 071446517","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #6 Small Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446517","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (22, 'Polybite Disposable Bite Trays Posterior Tray 50/Pkg | Dentamerica | 886', 'Polybite Disposable Bite Trays Posterior Tray', 'Dentamerica', '886', 1, 13.68, 13.68, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":22,"raw_product_description":"Polybite Disposable Bite Trays Posterior Tray 50/Pkg | Dentamerica | 886","normalized_product_name":"Polybite Disposable Bite Trays Posterior Tray","brand_or_manufacturer":"Dentamerica","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"886","unit_cost":13.68,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (23, 'CaviWipes Disinfecting Towelettes Large 6” x 6.75” (160/tub) | KaVo Kerr | 131100', 'CaviWipes Disinfecting Towelettes Large', 'KaVo Kerr', '131100', 3, 4.67, 14.01, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":23,"raw_product_description":"CaviWipes Disinfecting Towelettes Large 6” x 6.75” (160/tub) | KaVo Kerr | 131100","normalized_product_name":"CaviWipes Disinfecting Towelettes Large","brand_or_manufacturer":"KaVo Kerr","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"131100","unit_cost":4.67,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (24, 'Probes – # 15 UNC Rung Black Single End Standard Handle | American Eagle | AEPUNC15RB', 'Probes #15 UNC Rung Black Single End Standard Handle', 'American Eagle', 'AEPUNC15RB', 2, 16.43, 32.86, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":24,"raw_product_description":"Probes – # 15 UNC Rung Black Single End Standard Handle | American Eagle | AEPUNC15RB","normalized_product_name":"Probes #15 UNC Rung Black Single End Standard Handle","brand_or_manufacturer":"American Eagle","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"AEPUNC15RB","unit_cost":16.43,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (25, '0.9% Sodium Chloride Injection USP - 500 ml 2 Port 18/Pkg NDC 00409-7983-55 | ICU Medical Inc | 0798355', '0.9% Sodium Chloride Injection USP 500 ml 2 Port', 'ICU Medical Inc', '0798355', 1, 87.93, 87.93, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":25,"raw_product_description":"0.9% Sodium Chloride Injection USP - 500 ml 2 Port 18/Pkg NDC 00409-7983-55 | ICU Medical Inc | 0798355","normalized_product_name":"0.9% Sodium Chloride Injection USP 500 ml 2 Port","brand_or_manufacturer":"ICU Medical Inc","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0798355","unit_cost":87.93,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (26, 'Surgical Blades – Stainless Steel Sterile 100/Box 15 | Miltex by Integra | 4315', 'Surgical Blades Stainless Steel Sterile #15', 'Miltex by Integra', '4315', 1, 33.05, 33.05, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":26,"raw_product_description":"Surgical Blades – Stainless Steel Sterile 100/Box 15 | Miltex by Integra | 4315","normalized_product_name":"Surgical Blades Stainless Steel Sterile #15","brand_or_manufacturer":"Miltex by Integra","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"4315","unit_cost":33.05,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (27, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Monophase Regular Set 2 Cartridges | 3M | 5312', 'Paradigm VPS Impression Material Cartridge Refill Monophase Regular Set', '3M', '5312', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":27,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Monophase Regular Set 2 Cartridges | 3M | 5312","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Monophase Regular Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"5312","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (28, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Light Body Fast Set 2 Cartridges | 3M | 05511', 'Paradigm VPS Impression Material Cartridge Refill Light Body Fast Set', '3M', '05511', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":28,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Light Body Fast Set 2 Cartridges | 3M | 05511","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Light Body Fast Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05511","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (29, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Heavy Body Fast Set 2 Cartridges | 3M | 05513', 'Paradigm VPS Impression Material Cartridge Refill Heavy Body Fast Set', '3M', '05513', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":29,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Heavy Body Fast Set 2 Cartridges | 3M | 05513","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Heavy Body Fast Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05513","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (30, 'Evac-u-Trap 2350-FS Disposable Canister – Internal Thread Fine Mesh 3-1/2" x 4-3/8" 8/Pkg | KaVo Kerr | 2350FS', 'Evac-u-Trap 2350-FS Disposable Canister Internal Thread Fine Mesh', 'KaVo Kerr', '2350FS', 1, 69.65, 69.65, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":30,"raw_product_description":"Evac-u-Trap 2350-FS Disposable Canister – Internal Thread Fine Mesh 3-1/2\" x 4-3/8\" 8/Pkg | KaVo Kerr | 2350FS","normalized_product_name":"Evac-u-Trap 2350-FS Disposable Canister Internal Thread Fine Mesh","brand_or_manufacturer":"KaVo Kerr","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"2350FS","unit_cost":69.65,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (31, 'Hemodent Hemostatic Solution 20 cc Bottle | Premier | 9007072', 'Hemodent Hemostatic Solution 20 cc Bottle', 'Premier', '9007072', 1, 22.55, 22.55, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":31,"raw_product_description":"Hemodent Hemostatic Solution 20 cc Bottle | Premier | 9007072","normalized_product_name":"Hemodent Hemostatic Solution 20 cc Bottle","brand_or_manufacturer":"Premier","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"9007072","unit_cost":22.55,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (32, 'Cord Packer Instruments – Sherman Packer Double End Smooth | Premier | 1003578', 'Cord Packer Instruments Sherman Packer Double End Smooth', 'Premier', '1003578', 2, 18.86, 37.72, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":32,"raw_product_description":"Cord Packer Instruments – Sherman Packer Double End Smooth | Premier | 1003578","normalized_product_name":"Cord Packer Instruments Sherman Packer Double End Smooth","brand_or_manufacturer":"Premier","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1003578","unit_cost":18.86,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (33, 'Seal-Tight Spectrum Disposable Air/Water Syringe Tips 200/Pkg | Kerr TotalCare (Pinnacle) | 72200', 'Seal-Tight Spectrum Disposable Air/Water Syringe Tips', 'Kerr TotalCare (Pinnacle)', '72200', 2, 24.04, 48.08, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":33,"raw_product_description":"Seal-Tight Spectrum Disposable Air/Water Syringe Tips 200/Pkg | Kerr TotalCare (Pinnacle) | 72200","normalized_product_name":"Seal-Tight Spectrum Disposable Air/Water Syringe Tips","brand_or_manufacturer":"Kerr TotalCare (Pinnacle)","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"72200","unit_cost":24.04,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (34, 'Septocaine 4% Articaine HCl with Epinephrine – 1.7 ml Injection Cartridges 50/Pkg Epinephrine 1:100 000 | Septodont | 01A1400', 'Septocaine 4% Articaine HCl with Epinephrine', 'Septodont', '01A1400', 1, 40.50, 40.50, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":34,"raw_product_description":"Septocaine 4% Articaine HCl with Epinephrine – 1.7 ml Injection Cartridges 50/Pkg Epinephrine 1:100 000 | Septodont | 01A1400","normalized_product_name":"Septocaine 4% Articaine HCl with Epinephrine","brand_or_manufacturer":"Septodont","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"01A1400","unit_cost":40.5,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (35, 'Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard | SDI | 7510102', 'Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard', 'SDI', '7510102', 1, 12.55, 12.55, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":35,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard | SDI | 7510102","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"7510102","unit_cost":12.55,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (36, 'Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal | SDI | 7510203', 'Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal', 'SDI', '7510203', 1, 12.55, 12.55, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":36,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal | SDI | 7510203","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"7510203","unit_cost":12.55,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (37, 'Monoject 412 Curved Syringe Disposable 50/Box | Cardinal | 8881412012', 'Monoject 412 Curved Syringe Disposable', 'Cardinal', '8881412012', 1, 20.31, 20.31, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":37,"raw_product_description":"Monoject 412 Curved Syringe Disposable 50/Box | Cardinal | 8881412012","normalized_product_name":"Monoject 412 Curved Syringe Disposable","brand_or_manufacturer":"Cardinal","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"8881412012","unit_cost":20.31,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (38, 'Wave Flowable Composite 1 g Syringe Refill Wave HV A3 | SDI | 8210304', 'Wave Flowable Composite 1 g Syringe Refill Wave HV A3', 'SDI', '8210304', 1, 12.63, 12.63, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":38,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave HV A3 | SDI | 8210304","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave HV A3","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"8210304","unit_cost":12.63,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (39, 'Look Suture 4-0 18" Chromic Gut Monofilament C-6 Undyed Beige 12/Bx | Surgical Specialties | 558B', 'Look Suture 4-0 Chromic Gut Monofilament C-6 Undyed Beige', 'Surgical Specialties', '558B', 1, 27.26, 27.26, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":39,"raw_product_description":"Look Suture 4-0 18\" Chromic Gut Monofilament C-6 Undyed Beige 12/Bx | Surgical Specialties | 558B","normalized_product_name":"Look Suture 4-0 Chromic Gut Monofilament C-6 Undyed Beige","brand_or_manufacturer":"Surgical Specialties","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"558B","unit_cost":27.26,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (40, 'Waste Stick-On Bags – Red Biohazard 100/Pkg 9" x 10" 1.4 Quart | Unimed | CTRB042910', 'Waste Stick-On Bags Red Biohazard', 'Unimed', 'CTRB042910', 2, 23.68, 47.36, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":40,"raw_product_description":"Waste Stick-On Bags – Red Biohazard 100/Pkg 9\" x 10\" 1.4 Quart | Unimed | CTRB042910","normalized_product_name":"Waste Stick-On Bags Red Biohazard","brand_or_manufacturer":"Unimed","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"CTRB042910","unit_cost":23.68,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (41, 'Profluorid 5% Sodium Fluoride Varnish Single Dose Mint 0.4 ml Adult 50/Pkg | Voco | 2228', 'Profluorid 5% Sodium Fluoride Varnish Single Dose Mint', 'Voco', '2228', 1, 30.11, 30.11, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":41,"raw_product_description":"Profluorid 5% Sodium Fluoride Varnish Single Dose Mint 0.4 ml Adult 50/Pkg | Voco | 2228","normalized_product_name":"Profluorid 5% Sodium Fluoride Varnish Single Dose Mint","brand_or_manufacturer":"Voco","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"2228","unit_cost":30.11,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (42, 'Reli Disposable Safety Retractor Scalpel #15 Plastic/Stainless Steel Sterile | Myco | 6008TR15', 'Reli Disposable Safety Retractor Scalpel #15 Sterile', 'Myco', '6008TR15', 1, 13.75, 13.75, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":42,"raw_product_description":"Reli Disposable Safety Retractor Scalpel #15 Plastic/Stainless Steel Sterile | Myco | 6008TR15","normalized_product_name":"Reli Disposable Safety Retractor Scalpel #15 Sterile","brand_or_manufacturer":"Myco","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"6008TR15","unit_cost":13.75,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb)
  ) AS line(
    source_line_number,
    raw_product_description,
    normalized_product_name,
    brand_or_manufacturer,
    vendor_item_number,
    quantity_ordered,
    unit_price,
    calculated_line_total,
    image_present,
    source_screenshot,
    source_page,
    metadata
  )
), resolved AS (
  SELECT
    'd0000000-0000-0000-0000-000000000001'::uuid AS organization_id,
    c.id AS category_id,
    m.id AS manufacturer_id,
    u.id AS unit_of_measure_id,
    'DENTIRA-PTU317717-' || LPAD(source_lines.source_line_number::text, 3, '0') AS sku,
    source_lines.normalized_product_name AS name,
    source_lines.raw_product_description AS description,
    source_lines.brand_or_manufacturer AS brand_name,
    source_lines.vendor_item_number,
    source_lines.metadata
  FROM source_lines
  JOIN categories c
    ON c.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND c.slug = 'purchase-order-catalog-items'
  JOIN manufacturers m
    ON m.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND m.manufacturer_code = trim(both '_' from regexp_replace(upper(source_lines.brand_or_manufacturer), '[^A-Z0-9]+', '_', 'g'))
  JOIN units_of_measure u
    ON u.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND u.code = 'order-unit'
)
INSERT INTO products (
  organization_id,
  category_id,
  manufacturer_id,
  unit_of_measure_id,
  sku,
  name,
  description,
  manufacturer_part_number,
  brand_name,
  product_type,
  status,
  is_active,
  metadata
)
SELECT
  organization_id,
  category_id,
  manufacturer_id,
  unit_of_measure_id,
  sku,
  name,
  description,
  NULL,
  brand_name,
  'supply',
  'active',
  TRUE,
  metadata || jsonb_build_object('sku_source', sku, 'vendor_item_number', vendor_item_number)
FROM resolved
ON CONFLICT (organization_id, sku) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  manufacturer_id = EXCLUDED.manufacturer_id,
  unit_of_measure_id = EXCLUDED.unit_of_measure_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  manufacturer_part_number = EXCLUDED.manufacturer_part_number,
  brand_name = EXCLUDED.brand_name,
  product_type = EXCLUDED.product_type,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

WITH patterson_vendor AS (
  SELECT id
  FROM vendors
  WHERE organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND vendor_code = 'PATTERSON_DENTAL_SUPPLY_INC'
)
INSERT INTO purchase_orders (
  id,
  facility_id,
  supplier_id,
  po_number,
  po_date,
  expected_delivery_date,
  actual_delivery_date,
  status,
  total_amount,
  currency,
  notes,
  organization_id,
  vendor_id,
  estimated_savings,
  confirmation_number,
  mock_supplier_submission,
  metadata,
  deleted_at
)
SELECT
  'd4200000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'd4100000-0000-0000-0000-000000000001',
  'PTU317717',
  '2026-06-12 00:00:00',
  NULL,
  NULL,
  NULL,
  1384.47,
  'USD',
  'Imported from Dentira order-detail evidence. Shipping, tax, subtotal, receiving, delivery, and approval status were not available in the source.',
  'd0000000-0000-0000-0000-000000000001',
  patterson_vendor.id,
  0,
  NULL,
  FALSE,
  '{"source":"dentira_po_ptu317717","supplier":"PATTERSON DENTAL SUPPLY INC","dentira_order_number":"6209555669","shipping_label":"995 - Pembroke Pines","stated_total_items":42,"calculated_ordered_units":63,"source_total":1384.47,"status_source":"not_available","receiving_status_source":"not_available"}'::jsonb,
  NULL
FROM patterson_vendor
ON CONFLICT (po_number) DO UPDATE
SET
  facility_id = EXCLUDED.facility_id,
  supplier_id = EXCLUDED.supplier_id,
  po_date = EXCLUDED.po_date,
  expected_delivery_date = EXCLUDED.expected_delivery_date,
  actual_delivery_date = EXCLUDED.actual_delivery_date,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount,
  currency = EXCLUDED.currency,
  notes = EXCLUDED.notes,
  organization_id = EXCLUDED.organization_id,
  vendor_id = EXCLUDED.vendor_id,
  estimated_savings = EXCLUDED.estimated_savings,
  confirmation_number = EXCLUDED.confirmation_number,
  mock_supplier_submission = EXCLUDED.mock_supplier_submission,
  metadata = EXCLUDED.metadata,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = CURRENT_TIMESTAMP;

DELETE FROM purchase_order_items
WHERE purchase_order_id = 'd4200000-0000-0000-0000-000000000001'
  AND organization_id = 'd0000000-0000-0000-0000-000000000001'
  AND metadata->>'source' = 'dentira_po_ptu317717';

WITH source_lines AS (
  SELECT *
  FROM (
    VALUES
    (1, 'Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854', 'Braval Nitrile PF Exam Gloves, Lavender Blue, Small', 'Braval', '070367854', 2, 7.83, 15.66, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":1,"raw_product_description":"Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Small 300/Pkg | Braval | 070367854","normalized_product_name":"Braval Nitrile PF Exam Gloves, Lavender Blue, Small","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"070367854","unit_cost":7.83,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (2, 'Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Medium 300/Pkg | Braval | 070367862', 'Braval Nitrile PF Exam Gloves, Lavender Blue, Medium', 'Braval', '070367862', 4, 7.83, 31.32, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":2,"raw_product_description":"Braval Nitrile PF Exam Gloves – Powder Free Lavender Blue Medium 300/Pkg | Braval | 070367862","normalized_product_name":"Braval Nitrile PF Exam Gloves, Lavender Blue, Medium","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"070367862","unit_cost":7.83,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (3, 'TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window 100/Pkg Ultradent Valo | Tidi | 21105', 'TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window', 'Tidi', '21105', 1, 11.84, 11.84, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":3,"raw_product_description":"TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window 100/Pkg Ultradent Valo | Tidi | 21105","normalized_product_name":"TIDIshield Custom Fit Curing Light Sleeves with The SureCure Window","brand_or_manufacturer":"Tidi","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"21105","unit_cost":11.84,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (4, 'Patterson Topical Anesthetic Gel 1 oz Strawberry | Patterson Dental Supply | 0327019', 'Patterson Topical Anesthetic Gel 1 oz Strawberry', 'Patterson Dental Supply', '0327019', 5, 1.72, 8.60, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":4,"raw_product_description":"Patterson Topical Anesthetic Gel 1 oz Strawberry | Patterson Dental Supply | 0327019","normalized_product_name":"Patterson Topical Anesthetic Gel 1 oz Strawberry","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0327019","unit_cost":1.72,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (5, 'HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm | Surgical Esthetics | HACOLLP', 'HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm', 'Surgical Esthetics', 'HACOLLP', 2, 82.87, 165.74, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":5,"raw_product_description":"HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm | Surgical Esthetics | HACOLLP","normalized_product_name":"HealiAid Collagen Plug 10/Pkg 10 mm x 20 mm","brand_or_manufacturer":"Surgical Esthetics","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"HACOLLP","unit_cost":82.87,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (6, 'Patterson High Performance (HP) Bite Registration Flavored Fast Set Mint | Patterson Dental Supply | 0842997', 'Patterson High Performance Bite Registration Fast Set Mint', 'Patterson Dental Supply', '0842997', 1, 14.39, 14.39, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":6,"raw_product_description":"Patterson High Performance (HP) Bite Registration Flavored Fast Set Mint | Patterson Dental Supply | 0842997","normalized_product_name":"Patterson High Performance Bite Registration Fast Set Mint","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0842997","unit_cost":14.39,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (7, 'Patterson Lidocaine Anesthetic HCl 2% with Epinephrine – 1.7 ml Cartridges 50/Pkg 1:100 000 | Patterson Dental Supply | 05A0100', 'Patterson Lidocaine Anesthetic HCl 2% with Epinephrine', 'Patterson Dental Supply', '05A0100', 1, 29.77, 29.77, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":7,"raw_product_description":"Patterson Lidocaine Anesthetic HCl 2% with Epinephrine – 1.7 ml Cartridges 50/Pkg 1:100 000 | Patterson Dental Supply | 05A0100","normalized_product_name":"Patterson Lidocaine Anesthetic HCl 2% with Epinephrine","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05A0100","unit_cost":29.77,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (8, 'Solmetex NXT Hg5 Collection Container With Recycle Kit Ea | Solmetex | NXTHG5002CR', 'Solmetex NXT Hg5 Collection Container With Recycle Kit', 'Solmetex', 'NXTHG5002CR', 1, 299.99, 299.99, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":8,"raw_product_description":"Solmetex NXT Hg5 Collection Container With Recycle Kit Ea | Solmetex | NXTHG5002CR","normalized_product_name":"Solmetex NXT Hg5 Collection Container With Recycle Kit","brand_or_manufacturer":"Solmetex","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"NXTHG5002CR","unit_cost":299.99,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (9, 'Patterson Surgical Aspirator Tips 25/Pkg Large 1/4" Tip Green | Patterson Dental Supply | 082225', 'Patterson Surgical Aspirator Tips Large 1/4 Inch Green', 'Patterson Dental Supply', '082225', 2, 2.03, 4.06, true, 'IMG_4093.PNG', '1/4', '{"source":"dentira_po_ptu317717","source_line_number":9,"raw_product_description":"Patterson Surgical Aspirator Tips 25/Pkg Large 1/4\" Tip Green | Patterson Dental Supply | 082225","normalized_product_name":"Patterson Surgical Aspirator Tips Large 1/4 Inch Green","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"082225","unit_cost":2.03,"image_present":true,"image_source":"IMG_4093.PNG","image_source_page":"1/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (10, 'Patterson Saliva Ejectors 100/Pkg Clear with Blue Tip | Patterson Dental Supply | 1073964', 'Patterson Saliva Ejectors Clear with Blue Tip', 'Patterson Dental Supply', '1073964', 3, 2.00, 6.00, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":10,"raw_product_description":"Patterson Saliva Ejectors 100/Pkg Clear with Blue Tip | Patterson Dental Supply | 1073964","normalized_product_name":"Patterson Saliva Ejectors Clear with Blue Tip","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1073964","unit_cost":2,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (11, 'Patterson Cotton-Tipped Applicators – 100/Bag 10 Bags/Box 3" | Patterson Dental Supply | 1074004', 'Patterson Cotton-Tipped Applicators 3 Inch', 'Patterson Dental Supply', '1074004', 2, 2.55, 5.10, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":11,"raw_product_description":"Patterson Cotton-Tipped Applicators – 100/Bag 10 Bags/Box 3\" | Patterson Dental Supply | 1074004","normalized_product_name":"Patterson Cotton-Tipped Applicators 3 Inch","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1074004","unit_cost":2.55,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (12, 'Patterson Lead-Free Autoclave Indicator Tape 1" W x 60 Yards L | Patterson Dental Supply | STLF24MMP', 'Patterson Lead-Free Autoclave Indicator Tape', 'Patterson Dental Supply', 'STLF24MMP', 1, 4.94, 4.94, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":12,"raw_product_description":"Patterson Lead-Free Autoclave Indicator Tape 1\" W x 60 Yards L | Patterson Dental Supply | STLF24MMP","normalized_product_name":"Patterson Lead-Free Autoclave Indicator Tape","brand_or_manufacturer":"Patterson Dental Supply","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"STLF24MMP","unit_cost":4.94,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (13, 'Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A2 Low Translucency | GC America | 012932', 'Initial LiSi CAD/CAM Blocks Size 14 Shade A2 Low Translucency', 'GC America', '012932', 1, 82.92, 82.92, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":13,"raw_product_description":"Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A2 Low Translucency | GC America | 012932","normalized_product_name":"Initial LiSi CAD/CAM Blocks Size 14 Shade A2 Low Translucency","brand_or_manufacturer":"GC America","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"012932","unit_cost":82.92,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (14, 'Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A3 Low Translucency | GC America | 012933', 'Initial LiSi CAD/CAM Blocks Size 14 Shade A3 Low Translucency', 'GC America', '012933', 1, 82.92, 82.92, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":14,"raw_product_description":"Initial LiSi CAD/CAM Blocks ,Size 14 5/Pkg Shade A3 Low Translucency | GC America | 012933","normalized_product_name":"Initial LiSi CAD/CAM Blocks Size 14 Shade A3 Low Translucency","brand_or_manufacturer":"GC America","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"012933","unit_cost":82.92,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (15, 'Braval Earloop Face Masks – Latex Free 50/Pkg ASTM Level 3 Teal | Braval | 1446269', 'Braval Earloop Face Masks ASTM Level 3 Teal', 'Braval', '1446269', 3, 1.86, 5.58, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":15,"raw_product_description":"Braval Earloop Face Masks – Latex Free 50/Pkg ASTM Level 3 Teal | Braval | 1446269","normalized_product_name":"Braval Earloop Face Masks ASTM Level 3 Teal","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1446269","unit_cost":1.86,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (16, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #1 Large Upper | Braval | 071446467', 'Braval Perforated Disposable Impression Trays Blue #1 Large Upper', 'Braval', '071446467', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":16,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #1 Large Upper | Braval | 071446467","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #1 Large Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446467","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (17, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #2 Large Lower | Braval | 071446475', 'Braval Perforated Disposable Impression Trays Blue #2 Large Lower', 'Braval', '071446475', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":17,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #2 Large Lower | Braval | 071446475","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #2 Large Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446475","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (18, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #3 Medium Upper | Braval | 071446483', 'Braval Perforated Disposable Impression Trays Blue #3 Medium Upper', 'Braval', '071446483', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":18,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #3 Medium Upper | Braval | 071446483","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #3 Medium Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446483","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (19, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #4 Medium Lower | Braval | 071446491', 'Braval Perforated Disposable Impression Trays Blue #4 Medium Lower', 'Braval', '071446491', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":19,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #4 Medium Lower | Braval | 071446491","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #4 Medium Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446491","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (20, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #5 Small Upper | Braval | 071446509', 'Braval Perforated Disposable Impression Trays Blue #5 Small Upper', 'Braval', '071446509', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":20,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #5 Small Upper | Braval | 071446509","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #5 Small Upper","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446509","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (21, 'Braval Perforated Disposable Impression Trays – Blue 12/Pkg #6 Small Lower | Braval | 071446517', 'Braval Perforated Disposable Impression Trays Blue #6 Small Lower', 'Braval', '071446517', 1, 1.29, 1.29, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":21,"raw_product_description":"Braval Perforated Disposable Impression Trays – Blue 12/Pkg #6 Small Lower | Braval | 071446517","normalized_product_name":"Braval Perforated Disposable Impression Trays Blue #6 Small Lower","brand_or_manufacturer":"Braval","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"071446517","unit_cost":1.29,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (22, 'Polybite Disposable Bite Trays Posterior Tray 50/Pkg | Dentamerica | 886', 'Polybite Disposable Bite Trays Posterior Tray', 'Dentamerica', '886', 1, 13.68, 13.68, true, 'IMG_4094.PNG', '2/4', '{"source":"dentira_po_ptu317717","source_line_number":22,"raw_product_description":"Polybite Disposable Bite Trays Posterior Tray 50/Pkg | Dentamerica | 886","normalized_product_name":"Polybite Disposable Bite Trays Posterior Tray","brand_or_manufacturer":"Dentamerica","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"886","unit_cost":13.68,"image_present":true,"image_source":"IMG_4094.PNG","image_source_page":"2/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (23, 'CaviWipes Disinfecting Towelettes Large 6” x 6.75” (160/tub) | KaVo Kerr | 131100', 'CaviWipes Disinfecting Towelettes Large', 'KaVo Kerr', '131100', 3, 4.67, 14.01, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":23,"raw_product_description":"CaviWipes Disinfecting Towelettes Large 6” x 6.75” (160/tub) | KaVo Kerr | 131100","normalized_product_name":"CaviWipes Disinfecting Towelettes Large","brand_or_manufacturer":"KaVo Kerr","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"131100","unit_cost":4.67,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (24, 'Probes – # 15 UNC Rung Black Single End Standard Handle | American Eagle | AEPUNC15RB', 'Probes #15 UNC Rung Black Single End Standard Handle', 'American Eagle', 'AEPUNC15RB', 2, 16.43, 32.86, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":24,"raw_product_description":"Probes – # 15 UNC Rung Black Single End Standard Handle | American Eagle | AEPUNC15RB","normalized_product_name":"Probes #15 UNC Rung Black Single End Standard Handle","brand_or_manufacturer":"American Eagle","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"AEPUNC15RB","unit_cost":16.43,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (25, '0.9% Sodium Chloride Injection USP - 500 ml 2 Port 18/Pkg NDC 00409-7983-55 | ICU Medical Inc | 0798355', '0.9% Sodium Chloride Injection USP 500 ml 2 Port', 'ICU Medical Inc', '0798355', 1, 87.93, 87.93, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":25,"raw_product_description":"0.9% Sodium Chloride Injection USP - 500 ml 2 Port 18/Pkg NDC 00409-7983-55 | ICU Medical Inc | 0798355","normalized_product_name":"0.9% Sodium Chloride Injection USP 500 ml 2 Port","brand_or_manufacturer":"ICU Medical Inc","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"0798355","unit_cost":87.93,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (26, 'Surgical Blades – Stainless Steel Sterile 100/Box 15 | Miltex by Integra | 4315', 'Surgical Blades Stainless Steel Sterile #15', 'Miltex by Integra', '4315', 1, 33.05, 33.05, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":26,"raw_product_description":"Surgical Blades – Stainless Steel Sterile 100/Box 15 | Miltex by Integra | 4315","normalized_product_name":"Surgical Blades Stainless Steel Sterile #15","brand_or_manufacturer":"Miltex by Integra","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"4315","unit_cost":33.05,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (27, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Monophase Regular Set 2 Cartridges | 3M | 5312', 'Paradigm VPS Impression Material Cartridge Refill Monophase Regular Set', '3M', '5312', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":27,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Monophase Regular Set 2 Cartridges | 3M | 5312","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Monophase Regular Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"5312","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (28, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Light Body Fast Set 2 Cartridges | 3M | 05511', 'Paradigm VPS Impression Material Cartridge Refill Light Body Fast Set', '3M', '05511', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":28,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Light Body Fast Set 2 Cartridges | 3M | 05511","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Light Body Fast Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05511","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (29, 'Paradigm VPS Impression Material Cartridge Refill 50 ml Heavy Body Fast Set 2 Cartridges | 3M | 05513', 'Paradigm VPS Impression Material Cartridge Refill Heavy Body Fast Set', '3M', '05513', 1, 10.45, 10.45, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":29,"raw_product_description":"Paradigm VPS Impression Material Cartridge Refill 50 ml Heavy Body Fast Set 2 Cartridges | 3M | 05513","normalized_product_name":"Paradigm VPS Impression Material Cartridge Refill Heavy Body Fast Set","brand_or_manufacturer":"3M","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"05513","unit_cost":10.45,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (30, 'Evac-u-Trap 2350-FS Disposable Canister – Internal Thread Fine Mesh 3-1/2" x 4-3/8" 8/Pkg | KaVo Kerr | 2350FS', 'Evac-u-Trap 2350-FS Disposable Canister Internal Thread Fine Mesh', 'KaVo Kerr', '2350FS', 1, 69.65, 69.65, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":30,"raw_product_description":"Evac-u-Trap 2350-FS Disposable Canister – Internal Thread Fine Mesh 3-1/2\" x 4-3/8\" 8/Pkg | KaVo Kerr | 2350FS","normalized_product_name":"Evac-u-Trap 2350-FS Disposable Canister Internal Thread Fine Mesh","brand_or_manufacturer":"KaVo Kerr","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"2350FS","unit_cost":69.65,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (31, 'Hemodent Hemostatic Solution 20 cc Bottle | Premier | 9007072', 'Hemodent Hemostatic Solution 20 cc Bottle', 'Premier', '9007072', 1, 22.55, 22.55, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":31,"raw_product_description":"Hemodent Hemostatic Solution 20 cc Bottle | Premier | 9007072","normalized_product_name":"Hemodent Hemostatic Solution 20 cc Bottle","brand_or_manufacturer":"Premier","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"9007072","unit_cost":22.55,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (32, 'Cord Packer Instruments – Sherman Packer Double End Smooth | Premier | 1003578', 'Cord Packer Instruments Sherman Packer Double End Smooth', 'Premier', '1003578', 2, 18.86, 37.72, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":32,"raw_product_description":"Cord Packer Instruments – Sherman Packer Double End Smooth | Premier | 1003578","normalized_product_name":"Cord Packer Instruments Sherman Packer Double End Smooth","brand_or_manufacturer":"Premier","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"1003578","unit_cost":18.86,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (33, 'Seal-Tight Spectrum Disposable Air/Water Syringe Tips 200/Pkg | Kerr TotalCare (Pinnacle) | 72200', 'Seal-Tight Spectrum Disposable Air/Water Syringe Tips', 'Kerr TotalCare (Pinnacle)', '72200', 2, 24.04, 48.08, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":33,"raw_product_description":"Seal-Tight Spectrum Disposable Air/Water Syringe Tips 200/Pkg | Kerr TotalCare (Pinnacle) | 72200","normalized_product_name":"Seal-Tight Spectrum Disposable Air/Water Syringe Tips","brand_or_manufacturer":"Kerr TotalCare (Pinnacle)","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"72200","unit_cost":24.04,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (34, 'Septocaine 4% Articaine HCl with Epinephrine – 1.7 ml Injection Cartridges 50/Pkg Epinephrine 1:100 000 | Septodont | 01A1400', 'Septocaine 4% Articaine HCl with Epinephrine', 'Septodont', '01A1400', 1, 40.50, 40.50, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":34,"raw_product_description":"Septocaine 4% Articaine HCl with Epinephrine – 1.7 ml Injection Cartridges 50/Pkg Epinephrine 1:100 000 | Septodont | 01A1400","normalized_product_name":"Septocaine 4% Articaine HCl with Epinephrine","brand_or_manufacturer":"Septodont","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"01A1400","unit_cost":40.5,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (35, 'Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard | SDI | 7510102', 'Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard', 'SDI', '7510102', 1, 12.55, 12.55, true, 'IMG_4096.PNG', '3/4', '{"source":"dentira_po_ptu317717","source_line_number":35,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard | SDI | 7510102","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave A1 Standard","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"7510102","unit_cost":12.55,"image_present":true,"image_source":"IMG_4096.PNG","image_source_page":"3/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (36, 'Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal | SDI | 7510203', 'Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal', 'SDI', '7510203', 1, 12.55, 12.55, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":36,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal | SDI | 7510203","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave A2 Universal","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"7510203","unit_cost":12.55,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (37, 'Monoject 412 Curved Syringe Disposable 50/Box | Cardinal | 8881412012', 'Monoject 412 Curved Syringe Disposable', 'Cardinal', '8881412012', 1, 20.31, 20.31, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":37,"raw_product_description":"Monoject 412 Curved Syringe Disposable 50/Box | Cardinal | 8881412012","normalized_product_name":"Monoject 412 Curved Syringe Disposable","brand_or_manufacturer":"Cardinal","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"8881412012","unit_cost":20.31,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (38, 'Wave Flowable Composite 1 g Syringe Refill Wave HV A3 | SDI | 8210304', 'Wave Flowable Composite 1 g Syringe Refill Wave HV A3', 'SDI', '8210304', 1, 12.63, 12.63, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":38,"raw_product_description":"Wave Flowable Composite 1 g Syringe Refill Wave HV A3 | SDI | 8210304","normalized_product_name":"Wave Flowable Composite 1 g Syringe Refill Wave HV A3","brand_or_manufacturer":"SDI","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"8210304","unit_cost":12.63,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (39, 'Look Suture 4-0 18" Chromic Gut Monofilament C-6 Undyed Beige 12/Bx | Surgical Specialties | 558B', 'Look Suture 4-0 Chromic Gut Monofilament C-6 Undyed Beige', 'Surgical Specialties', '558B', 1, 27.26, 27.26, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":39,"raw_product_description":"Look Suture 4-0 18\" Chromic Gut Monofilament C-6 Undyed Beige 12/Bx | Surgical Specialties | 558B","normalized_product_name":"Look Suture 4-0 Chromic Gut Monofilament C-6 Undyed Beige","brand_or_manufacturer":"Surgical Specialties","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"558B","unit_cost":27.26,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (40, 'Waste Stick-On Bags – Red Biohazard 100/Pkg 9" x 10" 1.4 Quart | Unimed | CTRB042910', 'Waste Stick-On Bags Red Biohazard', 'Unimed', 'CTRB042910', 2, 23.68, 47.36, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":40,"raw_product_description":"Waste Stick-On Bags – Red Biohazard 100/Pkg 9\" x 10\" 1.4 Quart | Unimed | CTRB042910","normalized_product_name":"Waste Stick-On Bags Red Biohazard","brand_or_manufacturer":"Unimed","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"CTRB042910","unit_cost":23.68,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (41, 'Profluorid 5% Sodium Fluoride Varnish Single Dose Mint 0.4 ml Adult 50/Pkg | Voco | 2228', 'Profluorid 5% Sodium Fluoride Varnish Single Dose Mint', 'Voco', '2228', 1, 30.11, 30.11, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":41,"raw_product_description":"Profluorid 5% Sodium Fluoride Varnish Single Dose Mint 0.4 ml Adult 50/Pkg | Voco | 2228","normalized_product_name":"Profluorid 5% Sodium Fluoride Varnish Single Dose Mint","brand_or_manufacturer":"Voco","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"2228","unit_cost":30.11,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb),
    (42, 'Reli Disposable Safety Retractor Scalpel #15 Plastic/Stainless Steel Sterile | Myco | 6008TR15', 'Reli Disposable Safety Retractor Scalpel #15 Sterile', 'Myco', '6008TR15', 1, 13.75, 13.75, true, 'IMG_4095.PNG', '4/4', '{"source":"dentira_po_ptu317717","source_line_number":42,"raw_product_description":"Reli Disposable Safety Retractor Scalpel #15 Plastic/Stainless Steel Sterile | Myco | 6008TR15","normalized_product_name":"Reli Disposable Safety Retractor Scalpel #15 Sterile","brand_or_manufacturer":"Myco","supplier":"PATTERSON DENTAL SUPPLY INC","vendor_item_number":"6008TR15","unit_cost":13.75,"image_present":true,"image_source":"IMG_4095.PNG","image_source_page":"4/4","inventory_data_boundary":"PO-backed catalog item only; no inventory level was created from this order line."}'::jsonb)
  ) AS line(
    source_line_number,
    raw_product_description,
    normalized_product_name,
    brand_or_manufacturer,
    vendor_item_number,
    quantity_ordered,
    unit_price,
    calculated_line_total,
    image_present,
    source_screenshot,
    source_page,
    metadata
  )
), resolved AS (
  SELECT
    source_lines.*,
    p.id AS product_id
  FROM source_lines
  JOIN products p
    ON p.organization_id = 'd0000000-0000-0000-0000-000000000001'
   AND p.sku = 'DENTIRA-PTU317717-' || LPAD(source_lines.source_line_number::text, 3, '0')
)
INSERT INTO purchase_order_items (
  purchase_order_id,
  inventory_item_id,
  quantity_ordered,
  quantity_received,
  unit_price,
  line_total,
  uom,
  notes,
  organization_id,
  product_id,
  status,
  metadata,
  deleted_at
)
SELECT
  'd4200000-0000-0000-0000-000000000001',
  NULL,
  quantity_ordered,
  0,
  unit_price,
  calculated_line_total,
  'order-unit',
  raw_product_description,
  'd0000000-0000-0000-0000-000000000001',
  product_id,
  'open',
  metadata || jsonb_build_object('line_status_source', '-', 'schema_status_note', 'purchase_order_items.status requires an operational value; source line status was unavailable'),
  NULL
FROM resolved;

DO $$
DECLARE
  catalog_rows INTEGER;
  inventory_rows INTEGER;
  po_lines INTEGER;
  ordered_units NUMERIC;
  order_total NUMERIC;
BEGIN
  SELECT COUNT(*)
  INTO catalog_rows
  FROM products
  WHERE organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND metadata->>'source' = 'dentira_po_ptu317717';

  SELECT COUNT(*)
  INTO inventory_rows
  FROM inventory_levels il
  JOIN products p
    ON p.id = il.product_id
   AND p.organization_id = il.organization_id
  WHERE il.organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND p.metadata->>'source' = 'dentira_po_ptu317717'
    AND il.deleted_at IS NULL;

  SELECT COUNT(*), COALESCE(SUM(quantity_ordered), 0), COALESCE(SUM(line_total), 0)
  INTO po_lines, ordered_units, order_total
  FROM purchase_order_items
  WHERE purchase_order_id = 'd4200000-0000-0000-0000-000000000001'
    AND organization_id = 'd0000000-0000-0000-0000-000000000001'
    AND metadata->>'source' = 'dentira_po_ptu317717';

  IF catalog_rows <> 42 OR inventory_rows <> 0 OR po_lines <> 42 OR ordered_units <> 63 OR order_total <> 1384.47 THEN
    RAISE EXCEPTION 'Dentira PO PTU317717 seed validation failed: catalog %, inventory %, lines %, units %, total %',
      catalog_rows, inventory_rows, po_lines, ordered_units, order_total;
  END IF;
END $$;

COMMIT;
