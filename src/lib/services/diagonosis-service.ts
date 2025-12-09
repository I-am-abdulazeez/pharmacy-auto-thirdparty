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

// Search-based diagnosis fetching
export async function searchDiagnoses(searchText: string): Promise<Diagnosis[]> {
  if (!searchText.trim()) {
    return [];
  }

  const apiUrl = `${API_URL}/ListValues/GetAllDiagnosis?diagnosistext=${encodeURIComponent(searchText)}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch diagnoses");
    }

    const data = await response.json();

    return data.map((item: DiagnosisApiItem) => ({
      DiagnosisId: item.Value,
      DiagnosisName: item.Text,
    }));
  } catch (error) {
    toast.error(`Error searching diagnoses: ${error}`);
    throw error;
  }
}

// Legacy functions (keeping for backward compatibility if needed)
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
