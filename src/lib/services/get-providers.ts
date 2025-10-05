import { API_URL } from "../utils";

export type ProviderData = {
  pageSize: number;
  currentPage: number;
  totalRecord: number;
  totalPages: number;
  status: number;
  result: {
    provider: string;
    provider_id: string;
    ProviderAddress: string;
    phone1: string;
    region: string;
    medicaldirector: string;
    email: string;
    MedicalManager: string;
    StateOfOrigin: string;
    CityOfOrigin: string;
  }[];
};

export const fetchProvider = async ({
  enrolleeId = "",
  stateId = "0",
  pageSize = 2000
}: {
  enrolleeId?: string;
  stateId?: string;
  pageSize?: number;
}) => {
  const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;

  const params = new URLSearchParams({
    schemeid: "0",
    MinimumID: "0",
    NoOfRecords: pageSize.toString(),
    pageSize: pageSize.toString(),
    ProviderName: "",
    TypeID: "46",
    StateID: stateId,
    LGAID: "0",
    enrolleeid: enrolleeId,
    provider_id: "0"
  });

  const response = await fetch(`${apiUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<ProviderData>;
};
