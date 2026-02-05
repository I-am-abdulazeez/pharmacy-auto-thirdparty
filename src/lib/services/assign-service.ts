import toast from "react-hot-toast";

import { assignPendingsStore } from "../store/assign-pendings-store";
import { API_URL, transformApiResponse } from "../utils";

export interface PendingEnrollee {
  EnrolleeName: string;
  scheme_type: string;
  enrolleeid: string;
  inputteddate: string;
}

export interface AssignPharmacyPayload {
  enrolleeid: string;
  codetopharmacy: string;
  pharmacyid: number;
  assignedby: string;
  assignedon: string;
  entryno: number | undefined;
}

/**
 * Assigns multiple deliveries to a pharmacy in batch
 * @param payloads - Array of assignment payloads
 */
export const assignMultiplePharmacies = async (
  payloads: any[]
): Promise<any> => {
  try {
    assignPendingsStore.set((state) => ({
      ...state,
      isAssigning: true,
    }));

    const apiUrl = `${API_URL}/Pharmacy/UpdatePharmacyAutopayment`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloads),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign pharmacies: ${response.statusText}`);
    }

    const data = await response.json();

    assignPendingsStore.set((state) => ({
      ...state,
      isAssigning: false,
    }));

    // Adjust these conditions based on your API response structure
    const isSuccess =
      data.status === 200 ||
      data.ReturnMessage?.toLowerCase().includes("success");

    if (isSuccess) {
      toast.success(`All ${payloads.length} assignment(s) completed successfully!`);

      return { successful: payloads.length, failed: 0, data };
    } else {
      toast.error(data.ReturnMessage || "Failed to assign pharmacies.");

      return { successful: 0, failed: payloads.length, data };
    }
  } catch (error) {
    assignPendingsStore.set((state) => ({
      ...state,
      isAssigning: false,
    }));

    toast.error(`Failed to assign pharmacies: ${(error as Error).message}`);
    throw error;
  }
};


/**
 * Assigns a pharmacy to a single pending delivery
 * @param payload - Assignment payload
 */
export const assignPharmacy = async (
  payload: AssignPharmacyPayload
): Promise<any> => {
  try {
    assignPendingsStore.set((state) => ({
      ...state,
      isAssigning: true,
    }));

    const apiUrl = `${API_URL}/Pharmacy/UpdatePharmacyAutopayment`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign pharmacy: ${response.statusText}`);
    }

    const data = await response.json();

    assignPendingsStore.set((state) => ({
      ...state,
      isAssigning: false,
    }));

    if (
      data.status === 200 ||
      data.ReturnMessage?.toLowerCase().includes("success")
    ) {
      toast.success("Pharmacy assigned successfully!");

      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to assign pharmacy");
    }
  } catch (error) {
    assignPendingsStore.set((state) => ({
      ...state,
      isAssigning: false,
    }));

    toast.error(`Failed to assign pharmacy: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Fetches list of pending enrollees awaiting pharmacy assignment
 */
export const getPendingEnrollees = async (): Promise<any> => {
  try {
    assignPendingsStore.set((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    const apiUrl = `${API_URL}/Pharmacy/GetPending_Autopayment`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.result) {
      assignPendingsStore.set((state) => ({
        ...state,
        pendingEnrollees: Array.isArray(data.result)
          ? data.result
          : [data.result],
        isLoading: false,
        error: null,
      }));

      return data;
    } else {
      throw new Error(
        data.ReturnMessage || "Failed to fetch pending enrollees"
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    assignPendingsStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
      pendingEnrollees: [],
    }));

    throw error;
  }
};

/**
 * Fetches detailed deliveries for a specific enrollee
 * @param enrolleeId - Enrollee ID to fetch details for
 */
export const getPendingEnrolleeDetails = async (
  enrolleeId: string
): Promise<any> => {
  try {
    assignPendingsStore.set((state) => ({
      ...state,
      isLoadingDetails: true,
      detailsError: null,
    }));

    const apiUrl = `${API_URL}/Pharmacy/GetPending_Autopayment?enrolleeid=${enrolleeId}`;

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

      assignPendingsStore.set((state) => ({
        ...state,
        enrolleeDetails: transformedDeliveries,
        originalEnrolleeDetails: data.result[0],
        selectedEnrolleeId: enrolleeId,
        isLoadingDetails: false,
        detailsError: null,
      }));

      return data;
    } else {
      throw new Error(
        data.ReturnMessage || "Failed to fetch enrollee details"
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    assignPendingsStore.set((state) => ({
      ...state,
      isLoadingDetails: false,
      detailsError: errorMessage,
      enrolleeDetails: [],
    }));

    throw error;
  }
};

/**
 * Fetches list of Lagos pending enrollees awaiting pharmacy assignment
 */
export const getLagosPendingEnrollees = async (): Promise<any> => {
  try {
    assignPendingsStore.set((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    const apiUrl = `${API_URL}/Pharmacy/GetPending_Autopayment?enrolleeid=null&islagos=1`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.result) {
      assignPendingsStore.set((state) => ({
        ...state,
        pendingEnrollees: Array.isArray(data.result)
          ? data.result
          : [data.result],
        isLoading: false,
        error: null,
      }));

      return data;
    } else {
      throw new Error(
        data.ReturnMessage || "Failed to fetch pending enrollees"
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    assignPendingsStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
      pendingEnrollees: [],
    }));

    throw error;
  }
};

/**
 * Fetches detailed deliveries for a specific Lagos enrollee
 * @param enrolleeId - Enrollee ID to fetch details for
 */
export const getLagosPendingEnrolleeDetails = async (
  enrolleeId: string
): Promise<any> => {
  try {
    assignPendingsStore.set((state) => ({
      ...state,
      isLoadingDetails: true,
      detailsError: null,
    }));

    const apiUrl = `${API_URL}/Pharmacy/GetPending_Autopayment?enrolleeid=${enrolleeId}&islagos=1`;

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

      assignPendingsStore.set((state) => ({
        ...state,
        enrolleeDetails: transformedDeliveries,
        selectedEnrolleeId: enrolleeId,
        isLoadingDetails: false,
        detailsError: null,
      }));

      return data;
    } else {
      throw new Error(
        data.ReturnMessage || "Failed to fetch enrollee details"
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    assignPendingsStore.set((state) => ({
      ...state,
      isLoadingDetails: false,
      detailsError: errorMessage,
      enrolleeDetails: [],
    }));

    throw error;
  }
};
