export interface FacilityFormState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export const initialFacilityFormState: FacilityFormState = {
  status: "idle",
  message: null,
};
