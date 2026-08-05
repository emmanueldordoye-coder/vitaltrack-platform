"use server";

import { revalidatePath } from "next/cache";

import { createServerApiClient } from "@/lib/api/server";
import { createFacilityFormSchema } from "@/lib/validation/forms";

import type { FacilityFormState } from "./form-state";

export const createFacilityAction = async (
  _prevState: FacilityFormState,
  formData: FormData,
): Promise<FacilityFormState> => {
  const parsed = createFacilityFormSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    facilityType: formData.get("facilityType"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid facility data.",
    };
  }

  const apiClient = await createServerApiClient();
  await apiClient.createFacility(parsed.data);
  revalidatePath("/facilities");

  return {
    status: "success",
    message: "Facility created.",
  };
};
