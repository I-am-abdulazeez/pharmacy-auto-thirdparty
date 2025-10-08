import toast from "react-hot-toast";

import { API_URL } from "@/lib/utils";
import { appChunk, SearchCriteria } from "@/lib/store/app-store";


export type EnrolleeData = {
  Member_EnrolleeID: string,
  Member_MemberUniqueID: number,
  Member_FirstName: string,
  Member_Entry_date: string,
  Member_MemberTitle: string;
  Member_Surname: string,
  Member_MobileNo: string,
  Member_Email: string,
  Member_othernames: string,
  Member_Age: number,
  Member_Gender: string,
  Member_MemberStatus: number,
  Member_MemberStatus_Description: string,
  Member_Address: string;
  Plan_Category: string,
  Member_Phone_One: string,
  Member_EmailAddress_One: string,
  Client_PostalAddress: string,
  client_schemename: string;
  Member_ExpiryDate: string;
  Member_PlanID: string;
}

export type EnrolleeBenefitData = {
  RowId: number,
  Benefit: string,
  Limit: string,
  Used: number,
  AmtClaimed: number,
  Authorised: number,
  Balance: string,
  Scheme: number,
  Service: number,
  VisitsLimit: number,
  VisitsUsed: number,
  VisitsBalance: number,
  CoinsurancePercentage: number,
  CopaymentAmount: number,
  ServiceLimitUnits: number
}

export type EnrolleeResponse = {
  status: number,
  result: EnrolleeData[],
  profilepic: string,
}

export type EnrolleeBenefitResponse = {
  status: number,
  result: EnrolleeBenefitData[],
}

export const getEnrolleeById = async (
  enrolleeId: string
): Promise<EnrolleeResponse | null> => {
  try {
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeBioDataByEnrolleeID?enrolleeid=${enrolleeId}`
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }
    const data = (await response.json()) as EnrolleeResponse;


    appChunk.set((state) => ({
      ...state,
      enrolleeData: data.result[0]
    }))

    return data || null;
  } catch (error) {

    toast.error((error as Error).message);

    return null;
  }
};

export const getEnrolleeByMultipleFields = async (
  searchCriteria: SearchCriteria
): Promise<EnrolleeResponse | null> => {
  try {
    const queryParams = new URLSearchParams();

    if (searchCriteria.mobileNo?.trim()) {
      queryParams.append('mobileNo', searchCriteria.mobileNo.trim());
    }

    if (searchCriteria.email?.trim()) {
      queryParams.append('email', searchCriteria.email.trim());
    }

    if (searchCriteria.enrolleeId?.trim()) {
      queryParams.append('enrolleeid', searchCriteria.enrolleeId.trim());
    }

    if (searchCriteria.firstName?.trim()) {
      queryParams.append('firstname', searchCriteria.firstName.trim());
    }

    if (searchCriteria.lastName?.trim()) {
      queryParams.append('lastname', searchCriteria.lastName.trim());
    }

    if (!queryParams.toString()) {
      return null;
    }

    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeBioDataByDetails?${queryParams.toString()}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }

    const data = (await response.json()) as EnrolleeResponse;

    if (data.result && data.result.length > 0) {
      appChunk.set((state) => ({
        ...state,
        enrolleeData: data.result[0]
      }));
    }

    return data || null;
  } catch (error) {
    toast.error(`Error fetching enrollee data: ${(error as Error).message}`);
    throw error;
  }
};

export const getEnrolleeBenefitsBycif = async (
  cif: number
): Promise<EnrolleeBenefitResponse | null> => {
  try {
    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeBenefitsByCif_ChronicMedicines?cifno=${cif}`
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch enrollee data: ${response.status}`);
    }
    const data = (await response.json()) as EnrolleeBenefitResponse;

    return data || null;
  } catch (error) {
    toast.error(`Error fetching enrollee data: ${error}`);

    return null;
  }
};
