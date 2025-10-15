import { API_URL } from "../utils";

/**
 * Marks selected deliveries as paid
 * @param entryNumbers - Array of entry numbers to mark as paid
 * @returns Promise with the API response
 */
export const payAutoLine = async (entryNumbers: string[]): Promise<any> => {
  try {
    const payload = entryNumbers.map((entryNo) => ({
      Entryno: entryNo,
    }));

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
