import toast from "react-hot-toast";

import { API_URL } from "../utils";

export interface Rider {
  rider_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string | null;
  gender: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  license_number: string | null;
  license_expiry_date: string | null;
  registration_date: string;
  last_updated: string;
  status: string;
  profile_picture_url: string | null;
  notes: string | null;
}

export interface RidersResponse {
  status: number;
  message: string;
  result: Rider[];
}

export interface AssignRiderPayload {
  AssignedRider: string;
  EntryNo: number[];
}

export interface AssignRiderResponse {
  status: number;
  ReturnMessage: string;
  RowsAffected: number;
}

/**
 * Fetches all riders from the API
 * @returns Promise<Rider[]> - Array of riders
 */
export const fetchRiders = async (): Promise<Rider[]> => {
  try {
    const apiUrl = `${API_URL}/Riders/GetAllRiders`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data: RidersResponse = await response.json();

    if (data.status === 200 && data.result) {
      return data.result;
    } else {
      throw new Error(data.message || "Failed to fetch riders");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Assigns a rider to multiple deliveries
 * @param assignedRider - Name of the rider to assign
 * @param entryNos - Array of EntryNo values for deliveries
 * @returns Promise<AssignRiderResponse> - Assignment result
 */
export const assignRiderToDeliveries = async (
  assignedRider: string,
  entryNos: number[]
): Promise<AssignRiderResponse> => {
  try {
    const payload: AssignRiderPayload = {
      AssignedRider: assignedRider,
      EntryNo: entryNos,
    };

    const apiUrl = `${API_URL}/PharmacyDelivery/AssignRiderAutopayment`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data: AssignRiderResponse = await response.json();

    if (data.status === 200) {
      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to assign rider");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to the server";

    toast.error(errorMessage);
    throw error;
  }
};
