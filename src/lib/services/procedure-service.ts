import type { Procedure } from "@/types";

import { toast } from "react-hot-toast";

import { deliveryFormState } from "../store/delivery-store";

import { API_URL } from "@/lib/utils";

interface ProcedureApiItem {
  tariff_code: string;
  tariff_desc: string;
  Cost: string;
}

interface ProcedureApiResponse {
  result: ProcedureApiItem[];
}

let proceduresCache: Procedure[] = [];
let isInitialFetchDone = false;
let isFetching = false;

export async function getProcedures(
  page = 0,
  limit = 20,
  searchTerm?: string
): Promise<{ procedures: Procedure[]; hasMore: boolean }> {

  if (isFetching) {
    const startIndex = page * limit;

    return {
      procedures: proceduresCache.slice(startIndex, startIndex + limit),
      hasMore: proceduresCache.length > startIndex + limit,
    };
  }

  const startIndex = page * limit;

  if (isInitialFetchDone && proceduresCache.length >= startIndex + limit) {
    return {
      procedures: proceduresCache.slice(startIndex, startIndex + limit),
      hasMore: proceduresCache.length > startIndex + limit,
    };
  }

  isFetching = true;
  try {
    const pharmacyId = deliveryFormState.get().pharmacyId;

    if (!pharmacyId) {
      throw new Error("No pharmacy selected");
    }

    // Use the search term in the API URL, empty string if no search term
    const searchParam = searchTerm ? encodeURIComponent(searchTerm) : '';
    const apiUrl = `${API_URL}/ProviderNetwork/GetProceduresByFilter?filtertype=3&providerid=8520&searchbyname=${searchParam}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch procedures: ${response.status}`);
    }

    const data = await response.json() as ProcedureApiResponse;

    const procedures: Procedure[] = data.result.map((item: ProcedureApiItem) => ({
      ProcedureId: item.tariff_code,
      ProcedureName: item.tariff_desc,
      ProcedureQuantity: 1,
      cost: item.Cost
    }));

    proceduresCache = page === 0 ? procedures : [...proceduresCache, ...procedures];
    isInitialFetchDone = true;

    return {
      procedures: procedures.slice(0, limit),
      hasMore: procedures.length >= limit || proceduresCache.length > startIndex + limit,
    };
  } catch (error) {
    toast.error(`Failed to load procedures: ${error}`);

    return { procedures: [], hasMore: false };
  } finally {
    isFetching = false;
  }
}

export function initializeProceduresData() {
  getProcedures();
}

export function clearProceduresCache() {
  proceduresCache = [];
  isInitialFetchDone = false;
}
