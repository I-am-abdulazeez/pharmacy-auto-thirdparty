import { chunk } from "stunk";

import { EnrolleeData } from "../services/get-enrollee";

import { User } from "@/types";

interface Rider {
  FullName: string;
  rider_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string | null;
  gender: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  license_number: string | null;
  license_expiry_date: string | null;
  registration_date: string;
  last_updated: string;
  status: string;
  profile_picture_url: string | null;
  notes: string | null;
}

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
  rider: Rider | null;
  isRIder: boolean,
};

export const authStore = chunk<AuthState>({
  isLoading: false,
  user: null,
  rider: null,
  isRIder: false
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
