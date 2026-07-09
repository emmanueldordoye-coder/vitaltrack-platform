"use server";

import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api/server";

/**
 * Generates a suggested order for the first available facility and redirects
 * the user to the review page for the newly created order.
 *
 * Called by the "Generate Suggested Order" form on /suggested-orders.
 */
export async function generateOrderAction(formData: FormData) {
  const facilityId = formData.get("facilityId") as string;

  if (!facilityId) {
    // Should never happen — the hidden input is always present
    throw new Error("Facility ID is required to generate an order.");
  }

  const api = await createServerApiClient();
  const result = await api.generateSuggestedOrder({ facilityId });

  // If no low-stock items were found, stay on the list page
  if (!result.orders || result.orders.length === 0) {
    redirect("/suggested-orders?notice=no_low_stock");
  }

  // Redirect to review the first (and usually only) created order
  redirect(`/suggested-orders/${result.orders[0].id}`);
}

/**
 * Approves a suggested order and redirects to the purchase-confirmation page.
 *
 * Called by the "Approve & Submit" form on /suggested-orders/[id].
 */
export async function approveOrderAction(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const notes = formData.get("notes") as string | null;

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const api = await createServerApiClient();
  await api.approveSuggestedOrder(orderId, notes ?? undefined);

  // The confirmation details are fetched server-side on the confirmation page
  redirect(`/suggested-orders/${orderId}/confirmation`);
}
