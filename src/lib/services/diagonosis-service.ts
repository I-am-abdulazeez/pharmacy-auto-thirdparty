import { toast } from "react-hot-toast";

import { API_URL } from "@/lib/utils";
import { Diagnosis } from "@/types";

type DiagnosisApiItem = {
  Disabled: boolean;
  Group: string | null;
  Selected: boolean;
  Text: string;
  Value: string;
};

let allDiagnoses: Diagnosis[] = [];
let isDataLoaded = false;
let isLoading = false;

async function fetchAllDiagnosesFromAPI(): Promise<Diagnosis[]> {
  const apiUrl = `${API_URL}/ListValues/GetAllDiagnosis`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch diagnoses");
  }

  const data = await response.json();

  return data.map((item: DiagnosisApiItem) => ({
    DiagnosisId: item.Value,
    DiagnosisName: item.Text,
  }));
}

// Function to get paginated diagnoses from the preloaded data
export async function getDiagnoses(page = 0, limit = 20) {
  if (!isDataLoaded && !isLoading) {
    await initializeDiagnosesData();
  }

  while (isLoading) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedDiagnoses = allDiagnoses.slice(startIndex, endIndex);

  return {
    diagnoses: paginatedDiagnoses,
    hasMore: allDiagnoses.length > endIndex,
    total: allDiagnoses.length
  };
}

export async function initializeDiagnosesData() {
  if (isDataLoaded || isLoading) {
    return;
  }

  isLoading = true;
  try {
    allDiagnoses = await fetchAllDiagnosesFromAPI();
    isDataLoaded = true;
  } catch (error) {
    toast.error(`Error initializing diagnoses data:${error}`);
    allDiagnoses = [];
  } finally {
    isLoading = false;
  }
}

export function getAllDiagnoses(): Diagnosis[] {
  return allDiagnoses;
}

export function isDiagnosesDataLoaded(): boolean {
  return isDataLoaded;
}
