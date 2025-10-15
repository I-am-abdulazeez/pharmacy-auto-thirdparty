import { parseDate } from "@internationalized/date";

import { Attachment } from "../services/mail-service";

import { Delivery, DeliveryApiResponse } from "@/types";

export const API_URL = import.meta.env.VITE_PROGNOSIS_API_URL;

export const safeGet = (value: any, fallback: any) => {
  return value !== undefined && value !== null ? value : fallback;
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return (error as Error).message;
  }
};

export const parseDateString = (dateString: string) => {
  if (!dateString) return null;
  try {
    const dateOnly = dateString.split("T")[0];

    return parseDate(dateOnly);
  } catch {
    return null;
  }
};

export const transformApiResponse = (
  apiResponse: DeliveryApiResponse | any
): Delivery => {
  return {
    DeliveryFrequency: apiResponse.deliveryfrequency || "",
    DelStartDate: apiResponse.delStartdate || "",
    NextDeliveryDate: apiResponse.nextdeliverydate || "",
    FrequencyDuration: apiResponse.frequencyduration || "",
    EndDate: apiResponse.enddate || "",

    // Diagnosis information
    DiagnosisLines: [
      {
        DiagnosisName: apiResponse.diagnosisname || "",
        DiagnosisId: apiResponse.diagnosis_id || "",
      },
    ],

    // Procedure information
    ProcedureLines: [
      {
        ProcedureName: apiResponse.procedurename || "",
        ProcedureId: apiResponse.procdeureid || "",
        ProcedureQuantity: apiResponse.procedurequantity || 1,
        cost: apiResponse.cost || "",
        DosageDescription: apiResponse.DosageDescription || "",
      },
    ],

    // User and additional info
    DosageDescription: apiResponse.DosageDescription || "",
    Username: apiResponse.username || "",
    AdditionalInformation: apiResponse.additionalinformation || "",
    Comment: apiResponse.comment || "",
    IsDelivered: apiResponse.isdelivered || false,

    // Enrollee information
    EnrolleeId: apiResponse.enrolleeid || "",
    EnrolleeName: apiResponse.EnrolleeName || "",
    EnrolleeEmail: apiResponse.email || "",
    EnrolleeAge: apiResponse.enrollee_age || 0,

    // Scheme information
    SchemeName: apiResponse.schemename || "",
    SchemeId: apiResponse.schemeid || "",
    scheme_type: apiResponse.scheme_type || "",

    // Status
    Status: apiResponse.Status || "",
    memberstatus: apiResponse.memberstatus || "",

    // Pharmacy and delivery details
    Pharmacyid: apiResponse.pharmacyid || 0,
    PharmacyName: apiResponse.pharmacyname || "",
    deliveryaddress: apiResponse.deliveryaddress || "",
    phonenumber: apiResponse.phonenumber || "",
    othernumber: apiResponse.othernumber || "",
    cost: apiResponse.cost || "",
    recipientcode: apiResponse.recipientcode || "",

    // Additional API fields
    EntryNo: apiResponse.entryno,
    DeliveryId: apiResponse.deliveryid || "",

    // New fields from updated API
    inputteddate: apiResponse.inputteddate || "",
    modifieddate: apiResponse.modifieddate || "",
    email: apiResponse.email || "",
    codeexpirydate: apiResponse.codeexpirydate || "",
    paydate: apiResponse.paydate || null,
    ispaid: apiResponse.ispaid || null,
    codetopharmacy: apiResponse.codetopharmacy || null,
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const createAttachmentFromFile = async (
  file: File
): Promise<Attachment> => {
  const base64Data = await fileToBase64(file);

  return {
    FileName: file.name,
    ContentType: file.type,
    Base64Data: base64Data,
  };
};

/**
 * Generates a random 6-digit code
 * @returns string - A 6-digit numeric code
 */
export const generateRandomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
