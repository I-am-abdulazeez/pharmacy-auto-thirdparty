import type { Delivery } from "@/types";

import { chunk } from "stunk";

export interface PendingEnrollee {
  EnrolleeName: string;
  scheme_type: string;
  enrolleeid: string;
  inputteddate: string;
  inputtedtime: string;
  TimeUsed: string;
}

export interface OriginalEnrolleeDetail {
  entryno: number;
  diagnosisname: string;
  diagnosis_id: string;
  procedurename: string;
  procdeureid: string;
  procedurequantity: number;
  username: string;
  inputteddate: string;
  modifieddate: string;
  isdelivered: boolean;
  enrolleeid: string;
  email: string;
  codeexpirydate: string;
  pharmacyid: string;
  phonenumber: string;
  codetopharmacy: string | null;
  cost: number | null;
  DosageDescription: string;
  comment: string;
  othernumber: string;
  ispaid: number;
  paydate: string | null;
  assignedby: string | null;
  assignedon: string | null;
  Restoredby: string | null;
  Restoredon: string | null;
  islagos: boolean | null;
  memberaddress: string;
  wellapharmacyname: string | null;
  wellapharmacyid: string | null;
  EnrolleeName: string;
  scheme_type: string;
  memberaddress1: string;
  DateOfBirth: string;
  Gender: string;
  FirstName: string;
  lastname: string;
}


export const assignPendingsStore = chunk({
  pendingEnrollees: [] as PendingEnrollee[],
  enrolleeDetails: [] as Delivery[],
  selectedEnrolleeId: null as string | null,
  selectedPharmacyId: null as number | null,
  selectedPharmacyName: null as string | null,
  originalEnrolleeDetails: [] as OriginalEnrolleeDetail[],

  isLoading: false,
  isLoadingDetails: false,
  isAssigning: false,

  error: null as string | null,
  detailsError: null as string | null,

  showAssignModal: false,
});

export const assignPendingsActions = {
  selectEnrollee: (enrolleeId: string) => {
    assignPendingsStore.set((state) => ({
      ...state,
      selectedEnrolleeId: enrolleeId,
    }));
  },

  clearSelection: () => {
    assignPendingsStore.set((state) => ({
      ...state,
      selectedEnrolleeId: null,
      enrolleeDetails: [],
      detailsError: null,
    }));
  },

  openAssignModal: () => {
    assignPendingsStore.set((state) => ({
      ...state,
      showAssignModal: true,
    }));
  },

  closeAssignModal: () => {
    assignPendingsStore.set((state) => ({
      ...state,
      showAssignModal: false,
      selectedPharmacyId: null,
      selectedPharmacyName: null,
    }));
  },

  setPharmacy: (pharmacyId: number, pharmacyName: string) => {
    assignPendingsStore.set((state) => ({
      ...state,
      selectedPharmacyId: pharmacyId,
      selectedPharmacyName: pharmacyName,
    }));
  },

  clearPharmacy: () => {
    assignPendingsStore.set((state) => ({
      ...state,
      selectedPharmacyId: null,
      selectedPharmacyName: null,
    }));
  },
};
