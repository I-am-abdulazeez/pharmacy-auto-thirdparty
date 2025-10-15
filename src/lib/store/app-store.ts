import { chunk } from "stunk";

import { EnrolleeData } from "../services/enrollee-service";

import { User } from "@/types";

export type SearchCriteria = {
  enrolleeId: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
};

export const appChunk = chunk({
  enrolleeId: '',
  stateId: '',
  disciplineId: '',
  cityId: '',
  enrolleeData: null as EnrolleeData | null,
  searchCriteria: {
    enrolleeId: '',
    firstName: '',
    lastName: '',
    mobileNo: '',
    email: ''
  } satisfies SearchCriteria
})

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isLeadway: boolean;
  isProvider: boolean;
};

export const authStore = chunk<AuthState>({
  isLoading: false,
  user: null,
  isLeadway: false,
  isProvider: false,
})

export const resetProviderFilters = (stateId: string) => {
  appChunk.set((state) => ({
    ...state,
    stateId,
    enrolleeId: '',
    searchCriteria: {
      enrolleeId: '',
      firstName: '',
      lastName: '',
      mobileNo: '',
      email: ''
    }
  }));
};

export const clearSearchCriteria = () => {
  appChunk.set((state) => ({
    ...state,
    searchCriteria: {
      enrolleeId: '',
      firstName: '',
      lastName: '',
      mobileNo: '',
      email: ''
    },
    enrolleeData: null
  }));
};

export const logout = () => {
  authStore.reset()
}
