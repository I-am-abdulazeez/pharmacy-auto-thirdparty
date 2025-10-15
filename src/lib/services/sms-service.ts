import { API_URL } from "../utils";

export interface SmsPayload {
  To: string;
  Message: string;
  Source: string;
  SourceId: number;
  TemplateId: number;
  PolicyNumber: string;
  ReferenceNo: string;
  UserId: number;
}

/**
 * Sends an SMS message
 * @param smsPayload - SMS payload containing recipient and message details
 * @returns Promise with SMS sending response
 */
export const sendSms = async (smsPayload: SmsPayload): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/Sms/SendSms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    });

    if (!response.ok) {
      throw new Error(`SMS sending failed: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Sends a pharmacy pickup code via SMS
 * @param phoneNumber - Recipient phone number
 * @param pickupCode - The pharmacy pickup code
 * @param enrolleeId - Enrollee ID for reference
 * @param userId - User ID sending the SMS
 * @returns Promise with SMS response
 */
export const sendPharmacyPickupCode = async (
  phoneNumber: string,
  pickupCode: string,
  enrolleeId: string,
  userId: number = 0
): Promise<any> => {
  const message = `Your pharmacy pickup code is: ${pickupCode}. Please use this code to collect your medication. Thank you.`;

  const smsPayload: SmsPayload = {
    To: phoneNumber,
    Message: message,
    Source: "Pharmacy Delivery",
    SourceId: userId,
    TemplateId: 0,
    PolicyNumber: enrolleeId,
    ReferenceNo: pickupCode,
    UserId: userId,
  };

  return sendSms(smsPayload);
};
