import { API_URL } from "../utils";

/**
 * Marks selected deliveries as paid
 * @param entryNumbers - Array of entry numbers to mark as paid
 * @param pharmacyId - Pharmacy ID from logged in user
 * @param totalCost - Total cost of all selected deliveries
 * @param enrolleeId - Enrollee ID from the deliveries
 * @returns Promise with the API response
 */
export const payAutoLine = async (
  entryNumbers: string[],
  pharmacyId: string | number,
  totalCost: number,
  enrolleeId: string,
  isfrompbm: number
): Promise<any> => {
  try {
    const payload = {
      Entryno: entryNumbers,
      PharmacyId: Number(pharmacyId),
      Cost: totalCost,
      EnrolleeId: enrolleeId,
      isfrompbm
    };

    const response = await fetch(`${API_URL}/PharmacyDelivery/PayAutoline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Payment failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 200) {
      return data;
    } else {
      throw new Error(data.ReturnMessage || "Payment failed");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process payment";

    throw new Error(errorMessage);
  }
};
