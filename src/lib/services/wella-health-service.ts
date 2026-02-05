import { WELLA_API_URL, WELLA_HEALTH_PASSWORD, WELLA_HEALTH_USERNAME } from "../utils";

const getAuthHeader = () => {
  const credentials = btoa(`${WELLA_HEALTH_USERNAME}:${WELLA_HEALTH_PASSWORD}`);

  return `Basic ${credentials}`;
};

interface WellaHealthDrug {
  name: string;
  refId: string;
  quantity: string;
  notes?: string;
  diagnosis: string;
  diagnosisCode: string;
  dose: string;
}

interface WellaHealthPatientData {
  address: string;
  firstName: string;
  hmoId: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  email?: string;
  dateOfBirth?: string;
}

interface WellaHealthPayload {
  refId: string;
  pharmacyCode: string;
  fulfilmentService: string;
  diagnosis: string;
  notes: string;
  refPickupCode: string;
  isDelivery: boolean;
  patientData: WellaHealthPatientData;
  drugs: WellaHealthDrug[];
}

export interface WellaHealthPharmacy {
  pharmacyCode: string;
  pharmacyName: string;
  state: string;
  lga: string;
  area: string;
  address: string;
}

interface WellaHealthPharmaciesResponse {
  data: WellaHealthPharmacy[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
}

interface WellaHealthAPIParams {
  enrolleeData: any;
  selectedDeliveries: any[];
  pharmacyCode: string;
}

// Fetch Wella Health Pharmacies
export const fetchWellaHealthPharmacies = async (
  pageIndex: number = 1,
  pageSize: number = 100
): Promise<WellaHealthPharmaciesResponse> => {
  try {
    const response = await fetch(
      `${WELLA_API_URL}/Pharmacies?pageIndex=${pageIndex}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pharmacies: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch Wella Health pharmacies"
    );
  }
};

// Call Wella Health Fulfillment API
export const callWellaHealthFulfillmentAPI = async ({
  enrolleeData,
  selectedDeliveries,
  pharmacyCode,
}: WellaHealthAPIParams): Promise<any> => {
  if (!enrolleeData || selectedDeliveries.length === 0) {
    throw new Error("Missing enrollee details or delivery data");
  }

  // Parse enrollee name
  const nameParts = (enrolleeData.EnrolleeName || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Build drugs array from ALL selected deliveries and ALL their procedures
  const drugs: WellaHealthDrug[] = [];

  selectedDeliveries.forEach((delivery) => {
    // Check if ProcedureLines exists and is an array
    const procedureLines = delivery.ProcedureLines || [];

    if (Array.isArray(procedureLines) && procedureLines.length > 0) {
      // Add ALL procedures from this delivery
      procedureLines.forEach((procedure: any) => {
        drugs.push({
          name: procedure.ProcedureName || "",
          refId: delivery.EntryNo?.toString() || "",
          quantity: procedure.ProcedureQuantity?.toString() || "1",
          notes: delivery.Comment || "",
          diagnosis: delivery.DiagnosisLines?.[0]?.DiagnosisName || "",
          diagnosisCode: delivery.DiagnosisLines?.[0]?.DiagnosisId || "",
          dose: procedure.DosageDescription || delivery.DosageDescription || "default dose",
        });
      });
    } else {
      // Fallback: if no ProcedureLines array, check for single procedure
      drugs.push({
        name: delivery.ProcedureName || "",
        refId: delivery.EntryNo?.toString() || "",
        quantity: delivery.ProcedureQuantity?.toString() || "1",
        notes: delivery.Comment || "",
        diagnosis: delivery.DiagnosisLines?.[0]?.DiagnosisName || "",
        diagnosisCode: delivery.DiagnosisLines?.[0]?.DiagnosisId || "",
        dose: delivery.DosageDescription || "",
      });
    }
  });

  // Get primary diagnosis from first delivery (for the main diagnosis field)
  const primaryDiagnosis =
    selectedDeliveries[0]?.DiagnosisLines?.[0]?.DiagnosisName || "ICD";

  const payload: WellaHealthPayload = {
    refId: enrolleeData.EntryNo?.toString() || "102",
    pharmacyCode: pharmacyCode,
    fulfilmentService: "Telemedicine",
    diagnosis: primaryDiagnosis,
    notes: enrolleeData.Comment || "Additional Notes",
    refPickupCode: "", // Empty for now as per requirements
    isDelivery: false,
    patientData: {
      address: enrolleeData.memberaddress || "No address provided",
      firstName: firstName,
      hmoId: enrolleeData.enrolleeid || "",
      lastName: lastName,
      phoneNumber: enrolleeData.phonenumber || "",
      gender: enrolleeData.Gender || "Unknown",
      email: enrolleeData.email || "",
      dateOfBirth: enrolleeData.dateOfBirth || "2000-01-01",
    },
    drugs: drugs,
  };

  const response = await fetch(`${WELLA_API_URL}/fulfilments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `Wella Health API error: ${response.status}`
    );
  }

  return await response.json();
};
