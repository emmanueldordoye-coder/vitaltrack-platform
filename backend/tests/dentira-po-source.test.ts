import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const sourcePath = path.resolve(
  process.cwd(),
  "../database/sources/dentira_po_ptu317717.json",
);

test("Dentira PO PTU317717 source artifact reconciles", async () => {
  const source = JSON.parse(await readFile(sourcePath, "utf8")) as {
    source: {
      stated_total_items: number;
      calculated_ordered_units: number;
      order_total: number;
    };
    lines: Array<{
      source_line_number: number;
      vendor_item_number: string;
      quantity_ordered: number;
      unit_price: number;
      calculated_line_total: number;
    }>;
  };

  const orderedUnits = source.lines.reduce(
    (total, line) => total + line.quantity_ordered,
    0,
  );
  const extendedTotal = Number(
    source.lines
      .reduce(
        (total, line) => total + line.quantity_ordered * line.unit_price,
        0,
      )
      .toFixed(2),
  );
  const duplicateVendorItems = source.lines
    .map((line) => line.vendor_item_number)
    .filter((itemNumber, index, all) => all.indexOf(itemNumber) !== index);

  assert.equal(source.lines.length, 42);
  assert.equal(source.source.stated_total_items, 42);
  assert.equal(orderedUnits, 63);
  assert.equal(source.source.calculated_ordered_units, 63);
  assert.equal(extendedTotal, 1384.47);
  assert.equal(source.source.order_total, 1384.47);
  assert.deepEqual(duplicateVendorItems, []);
});
