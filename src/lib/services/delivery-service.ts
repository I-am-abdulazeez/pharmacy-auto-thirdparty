import toast from "react-hot-toast";
import { Dispatch, SetStateAction } from "react";

import { deliveryStore } from "../store/delivery-store";
import { API_URL, programmaticNavigate } from "../utils"

import { Delivery } from "@/types";

export const getDeliveries = async (username: string, enrolleeId: string, actionType?: string, fromDate?: string, toDate?: string, status?: string
): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/GetTracking?username=${encodeURIComponent(username || "")}&enrolleeId=${encodeURIComponent(enrolleeId || "")}&ACTIONTYPE=${actionType || ""}&FromDate=${fromDate || ""}&Todate=${toDate || ""}&DeliveryStatus=${encodeURIComponent(status || "")}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.result) {
      deliveryStore.set((state) => ({
        ...state,
        deliveries: data.result,
        isLoading: false,
        error: null,
        nextPackDate: data.result.nextpackdate || null,
      }));

      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch deliveries");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to the server";

    deliveryStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    throw error;
  }
};

export const createDelivery = async (deliveryData: { Deliveries: Delivery[] }, skipNavigation: boolean = false): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/InsertBatchDeliveryTracking`;

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
        result: null,
        ReturnMessage: data.ReturnMessage || `Failed to create delivery: ${response.status} ${response.statusText}`,
      };
    }

    if (!skipNavigation) {
      getDeliveries("", deliveryData.Deliveries[0].EnrolleeId);
      programmaticNavigate('/enrollees');
    }


    return {
      status: response.status,
      result: data,
      ReturnMessage: data.ReturnMessage || "Delivery created successfully",
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
    };
  }
};

export const editDelivery = async (formData: any): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/UpdateDeliveryLine`;

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

      return;
    }

    const enrolleeId = formData?.EnrolleeId;

    if (window.location.pathname === '/provider-pendings') {
      if (enrolleeId) {
        await getDeliveries("", enrolleeId, "9");
      }
    } else {
      // For other pages, use normal fetch
      await getDeliveries("", enrolleeId);

    }

    programmaticNavigate('/enrollees');

    return data;
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    toast.error(`Update error: ${error}`)
    throw error;
  }
};

export const deleteDelivery = async (delivery: any, setIsDeleting: Dispatch<SetStateAction<Record<string, boolean>>>) => {
  try {
    const deliveryId = delivery.original?.DeliveryId;
    const procedureId = delivery.original?.ProcedureLines?.[0]?.ProcedureId;
    const diagnosisId = delivery.original?.DiagnosisLines?.[0]?.DiagnosisId;

    if (!deliveryId || !procedureId || !diagnosisId) {
      toast.error("Missing required information for deletion");

      return;
    }

    setIsDeleting(prev => ({ ...prev, [delivery.key]: true }));

    const deleteData = {
      DeliveryId: deliveryId,
      ProcedureId: procedureId,
      DiagnosisId: diagnosisId
    };

    const response = await fetch(`${API_URL}/PharmacyDelivery/DeleteDeliveryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deleteData),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.ReturnMessage || "Failed to delete delivery");

      return;
    }

    toast.success(data.ReturnMessage || "Delivery deleted successfully");

    // Refresh deliveries based on current page - CHECK PROVIDER-PENDINGS FIRST
    const enrolleeId = delivery.original.EnrolleeId;

    if (window.location.pathname === '/provider-pendings') {
      await getDeliveries("", "", "9");
    } else {
      await getDeliveries("", enrolleeId);
    }
  } catch (error) {
    toast.error(`Delete delivery error: ${error}`);
  } finally {
    setIsDeleting(prev => ({ ...prev, [delivery.key]: false }));
  }
};
