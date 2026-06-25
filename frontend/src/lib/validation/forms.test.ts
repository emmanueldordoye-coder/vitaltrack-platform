import {
  createFacilityFormSchema,
  createInventoryItemFormSchema,
  signInFormSchema,
} from "@/lib/validation/forms";

describe("form schemas", () => {
  it("validates sign-in fields", () => {
    expect(
      signInFormSchema.safeParse({
        email: "valid@example.com",
        password: "password123",
      }).success,
    ).toBe(true);

    expect(
      signInFormSchema.safeParse({
        email: "invalid",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("requires facility name", () => {
    expect(
      createFacilityFormSchema.safeParse({
        name: "Main Hospital",
        timezone: "UTC",
      }).success,
    ).toBe(true);

    expect(
      createFacilityFormSchema.safeParse({
        name: "",
        timezone: "UTC",
      }).success,
    ).toBe(false);
  });

  it("requires inventory sku and name", () => {
    expect(
      createInventoryItemFormSchema.safeParse({
        sku: "MED-001",
        name: "Surgical Gloves",
        currency: "USD",
      }).success,
    ).toBe(true);

    expect(
      createInventoryItemFormSchema.safeParse({
        sku: "",
        name: "",
      }).success,
    ).toBe(false);
  });
});
