import { asyncChunk } from "stunk";

import { API_URL } from "../utils";

export type State = {
  Disabled: boolean;
  Group: null | string;
  Selected: boolean;
  Text: string;
  Value: string;
};

export const statesChunk = asyncChunk(
  async () => {
    const response = await fetch(`${API_URL}/ListValues/GetStates`);

    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status}`);
    }

    const allStates = await response.json() as State[];

    return allStates
      .filter((state) => state.Value !== "71" && state.Value !== "25")
      .sort((a, b) => a.Text.localeCompare(b.Text));
  },
  {
    refresh: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  }
);

export type City = {
  Disabled: boolean;
  Group: null | string;
  Selected: boolean;
  Text: string;
  Value: string;
};

export const citiesChunk = asyncChunk(async ({ stateId }: { stateId: string }) => {
  if (!stateId) {
    throw new Error("State ID is required");
  }

  try {
    const response = await fetch(`${API_URL}/ListValues/GetCitiesByStates?state=${stateId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`);
    }
    const data = await response.json() as City[];

    return data;
  } catch (error) {
    throw error;
  }
},
  {
    enabled: false,
    refresh: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  }
);
