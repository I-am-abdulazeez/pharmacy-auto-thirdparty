import toast from "react-hot-toast";
import { Dispatch, SetStateAction } from "react";

import { deliveryStore } from "../store/delivery-store";
import { API_URL, transformApiResponse } from "../utils";

import { Delivery } from "@/types";

/**
 * Fetches deliveries based on various filter criteria
 * @param enrolleeId - Enrollee ID to filter by (can be ID or name)
 * @param phone - Phone number to filter by
 * @param email - Email to filter by
 * @param pharmacyid - Pharmacy ID to filter by
 * @param showall - Whether to show all deliveries
 */
export const getDeliveries = async (
  enrolleeId: string = "",
  phone: string = "",
  email: string = "",
  pharmacyid: string = "",
  codetopharmacy: string = "",
  showall: boolean = false
): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    // Build query parameters
    const params = new URLSearchParams();

    if (enrolleeId) params.append("enrolleeId", enrolleeId);
    if (phone) params.append("phone", phone);
    if (email) params.append("email", email);
    if (pharmacyid) params.append("pharmacyid", pharmacyid);
    if (codetopharmacy) params.append("codetopharmacy", codetopharmacy)
    params.append("showall", String(showall));

    const apiUrl = `${API_URL}/Pharmacy/GetPharmacyAutopayment?${params.toString()}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.result) {
      // Transform each delivery from API format to internal format
      const transformedDeliveries = Array.isArray(data.result)
        ? data.result.map(transformApiResponse)
        : [transformApiResponse(data.result)];

      deliveryStore.set((state) => ({
        ...state,
        deliveries: transformedDeliveries,
        isLoading: false,
        error: null,
        nextPackDate: data.result.nextpackdate || null,
      }));

      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch deliveries");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    deliveryStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
      deliveries: [],
    }));

    throw error;
  }
};

/**
 * Creates a new delivery
 * @param deliveryData - Delivery data containing array of deliveries
 * @param skipNavigation - Whether to skip navigation after creation
 */
export const createDelivery = async (
  deliveryData: { Deliveries: Delivery[]; ConfirmDuplicates?: boolean },
  skipNavigation: boolean = false
): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/InsertPharmacyPickup`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deliveryData),
    });

    const data = await response.json();

    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    if (!response.ok) {
      return {
        status: response.status,
        result: data,
        ReturnMessage:
          data.ReturnMessage ||
          `Failed to create delivery: ${response.status} ${response.statusText}`,
        Warnings: data.Warnings || [],
        Errors: data.Errors || [],
      };
    }

    // Refresh deliveries and navigate if not skipping
    if (!skipNavigation) {
      const enrolleeId = deliveryData.Deliveries[0]?.EnrolleeId;

      if (enrolleeId) {
        await getDeliveries(enrolleeId);
      }
    }

    return {
      status: response.status,
      result: data,
      ReturnMessage: data.ReturnMessage || "Delivery created successfully",
      Warnings: data.Warnings || [],
      Errors: data.Errors || [],
    };
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    toast.error(`Create delivery error: ${error}`);

    return {
      status: 0,
      result: null,
      ReturnMessage: "Failed to connect to the server",
      Warnings: [],
      Errors: [],
    };
  }
};

/**
 * Updates an existing delivery
 * @param formData - Form data with delivery updates
 */
export const editDelivery = async (formData: any): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/UpdatePickUpLine`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    if (!response.ok) {
      toast.error(data.ReturnMessage || "Failed to update delivery");

      return data;
    }

    return data;
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    toast.error(`Update error: ${error}`);
    throw error;
  }
};

/**
 * Deletes a delivery line
 * @param delivery - Delivery object to delete
 * @param setIsDeleting - State setter for loading state
 */
export const deleteDelivery = async (
  delivery: any,
  setIsDeleting: Dispatch<SetStateAction<Record<string, boolean>>>
): Promise<void> => {
  try {
    // Extract IDs from the transformed delivery structure
    const deliveryId = delivery.original?.EntryNo;
    const procedureId = delivery.original?.ProcedureLines?.[0]?.ProcedureId;
    const diagnosisId = delivery.original?.DiagnosisLines?.[0]?.DiagnosisId;
    const enrolleeId = delivery.original?.EnrolleeId;


    if (!deliveryId || !procedureId || !diagnosisId) {
      toast.error("Missing required information for deletion");

      return;
    }

    setIsDeleting((prev) => ({ ...prev, [delivery.key]: true }));

    const deleteData = {
      DeliveryId: deliveryId,
      ProcedureId: procedureId,
      DiagnosisId: diagnosisId,
    };

    const response = await fetch(
      `${API_URL}/PharmacyDelivery/DeletePickupLine`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.ReturnMessage || "Failed to delete delivery");

      return;
    }

    toast.success(data.ReturnMessage || "Delivery deleted successfully");

    // Refresh deliveries based on current page
    if (enrolleeId) {
      if (window.location.pathname === "/provider-pendings") {
        await getDeliveries(enrolleeId);
      } else {
        await getDeliveries(enrolleeId);
      }
    }

    // Also remove from local state for immediate UI update
    deliveryStore.set((state) => ({
      ...state,
      deliveries: state.deliveries.filter(
        (d) => d.DeliveryId !== deliveryId
      ),
    }));
  } catch (error) {
    toast.error(`Delete delivery error: ${error}`);
  } finally {
    setIsDeleting((prev) => ({ ...prev, [delivery.key]: false }));
  }
};
