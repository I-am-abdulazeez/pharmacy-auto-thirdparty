import { asyncChunk } from "stunk";

import { fetchProvider } from "../services/get-providers";

export const providersChunk = asyncChunk(
  async ({ enrolleeId, stateId }: { enrolleeId?: string; stateId?: string }) => {
    if (!enrolleeId && (!stateId || stateId === "0")) {
      return {
        data: {
          status: 200,
          result: [],
          totalRecord: 0,
          pageSize: 0,
          currentPage: 0,
          totalPages: 0,
        },
        total: 0,
      };
    }

    const params = {
      enrolleeId: enrolleeId || "",
      stateId: stateId || "0",
    };

    const data = await fetchProvider(params);

    return {
      data: data,
      total: data.totalRecord,
    };
  },
  {
    enabled: true, // Now enabled
    refresh: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  }
);
