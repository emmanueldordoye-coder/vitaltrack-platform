export interface InventoryFormState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export const initialInventoryFormState: InventoryFormState = {
  status: "idle",
  message: null,
};
