import {
  formatCustomerFacilityLabel,
  formatCustomerWorkspaceLabel,
} from "./customer-context";

describe("customer presentation context", () => {
  it("renders Dentira fixture workspace labels as PDS Health customer context", () => {
    expect(formatCustomerWorkspaceLabel("Dentira Main Office")).toBe(
      "PDS Health Workspace",
    );
    expect(formatCustomerWorkspaceLabel(null)).toBe("PDS Health Workspace");
  });

  it("renders Dentira fixture facility labels as customer-safe site labels", () => {
    expect(formatCustomerFacilityLabel("Dentira Main Office")).toBe(
      "PDS Health pilot site",
    );
    expect(formatCustomerFacilityLabel(null)).toBe("PDS Health pilot site");
  });

  it("keeps non-primary Dentira fixture facilities distinguishable", () => {
    expect(formatCustomerFacilityLabel("Dentira Secondary Office")).toBe(
      "PDS Health Secondary Office",
    );
  });

  it("preserves non-Dentira labels from real workspace data", () => {
    expect(formatCustomerWorkspaceLabel("Austin Operations")).toBe(
      "Austin Operations",
    );
    expect(formatCustomerFacilityLabel("Austin Operations")).toBe(
      "Austin Operations",
    );
  });
});
