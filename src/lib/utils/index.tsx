import { parseDate } from "@internationalized/date";

import { Attachment } from "../services/mail";

import { Delivery } from "@/types";

export const API_URL = import.meta.env.VITE_PROGNOSIS_API_URL;

export const safeGet = (value: any, fallback: any) => {
  return value !== undefined && value !== null ? value : fallback;
};

let navigateFunction: any = null;

export const setNavigateFunction = (navigate: any) => {
  navigateFunction = navigate;
};

export const programmaticNavigate = (path: string) => {
  if (navigateFunction) {
    navigateFunction(path);
  }
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

export const transformApiResponse = (apiResponse: any): Delivery => {
  return {
    DeliveryFrequency: apiResponse.deliveryfrequency,
    DelStartDate: apiResponse.delStartdate,
    NextDeliveryDate: apiResponse.nextdeliverydate,
    DiagnosisLines: [
      {
        DiagnosisName: apiResponse.diagnosisname,
        DiagnosisId: apiResponse.diagnosis_id,
      },
    ],
    ProcedureLines: [
      {
        ProcedureName: apiResponse.procedurename,
        ProcedureId: apiResponse.procdeureid,
        ProcedureQuantity: apiResponse.procedurequantity,
        cost: apiResponse.cost,
        dosageDescription: apiResponse.DosageDescription,
      },
    ],
    Username: apiResponse.username,
    AdditionalInformation: apiResponse.additionalinformation,
    Comment: apiResponse.comment,
    IsDelivered: apiResponse.isdelivered,
    Status: apiResponse.Status,
    EnrolleeId: apiResponse.enrolleeid,
    EnrolleeName: apiResponse.enrolleename,
    EnrolleeAge: apiResponse.enrollee_age,
    SchemeName: apiResponse.schemename,
    SchemeId: apiResponse.schemeid,
    FrequencyDuration: apiResponse.frequencyduration,
    EndDate: apiResponse.enddate,
    // Additional fields from API response
    EntryNo: apiResponse.entryno,
    DeliveryId: apiResponse.deliveryid,
    Pharmacyid: apiResponse.pharmacyid,
    PharmacyName: apiResponse.pharmacyname,
    deliveryaddress: apiResponse.deliveryaddress,
    phonenumber: apiResponse.phonenumber,
    cost: apiResponse.cost,
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
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
