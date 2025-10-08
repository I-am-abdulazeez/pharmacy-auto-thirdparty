import { toast } from "react-hot-toast";

import { API_URL } from "@/lib/utils";
import { Provider } from "@/types";

interface ProviderApiItem {
  provider_id: number;
  provider: string;
}

interface ProviderData {
  result: ProviderApiItem[];
  currentPage: number;
  totalPages: number;
}

export async function fetchSelectProviders(
  offset = 0,
  limit = 20,
  enrolleeId = "",
  stateId = "0"
): Promise<{ providers: Provider[]; hasMore: boolean; currentPage: number; totalPages: number }> {
  try {
    if (!enrolleeId) {
      return { providers: [], hasMore: false, currentPage: 0, totalPages: 0 };
    }

    const apiUrl = `${API_URL}/EnrolleeProfile/GetEnrolleeProvidersListsAll`;
    const params = new URLSearchParams({
      schemeid: "0",
      MinimumID: offset.toString(),
      NoOfRecords: "2000",
      pageSize: limit.toString(),
      ProviderName: "",
      TypeID: "46",
      StateID: stateId,
      LGAID: "0",
      enrolleeid: enrolleeId,
      provider_id: "0",
    });

    const url = `${apiUrl}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.status}`);
    }

    const data = await response.json() as ProviderData;

    const providers: Provider[] = data.result.map((item: ProviderApiItem) => ({
      Pharmacyid: item.provider_id,
      PharmacyName: item.provider,
    }));

    return {
      providers,
      hasMore: data.result.length === limit || data.currentPage < data.totalPages,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    };
  } catch (error) {
    toast.error(`Failed to load providers: ${error}`);

    return { providers: [], hasMore: false, currentPage: 0, totalPages: 0 };
  }
}

export function initializeProvidersData() {
  fetchSelectProviders();
}
