import { chunk } from "stunk";
import toast from "react-hot-toast";

import { safeGet } from "../utils";

import { appChunk, authStore } from "./app-store";


import { Delivery, Diagnosis, Procedure, Provider } from "@/types";
import { getDeliveries } from "@/lib/services/delivery-service";

export const initialFormState = {
  enrolleeId: "",
  enrolleeName: "",
  enrolleeAge: 0,
  schemeId: "",
  schemeName: "",
  deliveryaddress: "",
  phonenumber: "",
  cost: "",
  Tobedeliverdby: "",

  pharmacyId: 8520,
  pharmacyName: "",

  deliveryFrequency: "",
  delStartDate: "",
  nextDeliveryDate: "",
  frequencyDuration: "",
  endDate: "",

  diagnosisLines: [] as Diagnosis[],
  procedureLines: [] as Procedure[],

  additionalInformation: "",
  dosageDescription: "",
  comment: "",


  currentStep: 1,
  totalSteps: 5,
  isEditing: false,
  entryno: 0
};

export const deliveryFormState = chunk(initialFormState);

export type PendingApproval = {
  enrolleeid: string;
  enrolleename: string;
  enrollee_age: string;
  schemename: string;
  LastEditedDate: string;
  consolidated_diagnosis: string;
}

export const deliveryStore = chunk({
  deliveries: [] as Delivery[],
  pendingApprovalList: [] as PendingApproval[],
  showDetailView: false,
  isLoading: false,
  isSubmitting: false,
  isPackingLoading: false,
  error: null as string | null,
  packingError: null as string | null,
  selectedEnrolleeId: null as string | null,
  packingSuccess: false,
  lastSearchedEnrolleeId: null as string | null,
  showModal: false,
  showPackModal: false,
  showDuplicateModal: false,
  nextPackDate: null as string | null,
  nextDeliveryDate: null as string | null,
  cost: "" as string,
  Tobedeliverdby: "" as string,
  pendingSubmission: false,
  duplicateDeliveries: [] as Delivery[]
})

export const deliveryActions = {
  openModal: () => {
    deliveryStore.set(state => ({ ...state, showModal: true }));
    deliveryFormState.reset();
  },

  closeModal: () => {
    deliveryStore.set(state => ({ ...state, showModal: false }));
  },

  openPackModal: () => {
    deliveryStore.set(state => ({ ...state, showPackModal: true }));
  },

  closePackModal: () => {
    deliveryStore.set(state => ({ ...state, showPackModal: false, nextPackDate: null, nextDeliveryDate: null }));
  },

  openDuplicateModal: (duplicates: Delivery[]) => {
    deliveryStore.set(state => ({
      ...state,
      showDuplicateModal: true,
      duplicateDeliveries: duplicates,
      pendingSubmission: true
    }));
  },

  closeDuplicateModal: () => {
    deliveryStore.set(state => ({
      ...state,
      showDuplicateModal: false,
      duplicateDeliveries: [],
      pendingSubmission: false
    }));
  },

  setNextPackDate: (date: string | null) => {
    deliveryStore.set(state => ({ ...state, nextPackDate: date }));
  },

  setNextDeliveryDate: (date: string | null) => {
    deliveryStore.set(state => ({ ...state, nextDeliveryDate: date }));
  },

  updateProcedureDosage: (procedureId: string, dosageDescription: string) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: state.procedureLines.map(p =>
        p.ProcedureId === procedureId ? { ...p, DosageDescription: dosageDescription } : p
      )
    }));
  },

  nextStep: () => {
    deliveryFormState.set(state => {
      if (state.currentStep < state.totalSteps) {
        return { ...state, currentStep: state.currentStep + 1 };
      }

      return state;
    });
  },

  prevStep: () => {
    deliveryFormState.set(state => {
      if (state.currentStep > 1) {
        return { ...state, currentStep: state.currentStep - 1 };
      }

      return state;
    });
  },

  selectEnrolleeForDetails: (enrolleeId: string) => {
    deliveryStore.set((state) => ({
      ...state,
      selectedEnrolleeId: enrolleeId,
      showDetailView: true,
    }));
  },

  backToListView: () => {
    deliveryStore.set((state) => ({
      ...state,
      selectedEnrolleeId: null,
      showDetailView: false,
      deliveries: [],
    }));
  },

  goToStep: (step: number) => {
    deliveryFormState.set(state => {
      if (step >= 1 && step <= state.totalSteps) {
        return { ...state, currentStep: step };
      }

      return state;
    });
  },

  updateFormField: (field: string, value: any) => {
    deliveryFormState.set(state => ({
      ...state,
      [field]: value
    }));
  },

  addDiagnosis: (diagnosis: Diagnosis) => {
    deliveryFormState.set(state => ({
      ...state,
      diagnosisLines: [...state.diagnosisLines, diagnosis]
    }));
  },

  removeDiagnosis: (diagnosisId: string) => {
    deliveryFormState.set(state => ({
      ...state,
      diagnosisLines: state.diagnosisLines.filter(d => d.DiagnosisId !== diagnosisId)
    }));
  },

  addProcedure: (procedure: Procedure) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: [...state.procedureLines, procedure]
    }));
  },

  setProvider: (provider: Provider) => {
    deliveryFormState.set(state => ({
      ...state,
      pharmacyId: provider.Pharmacyid,
      pharmacyName: provider.PharmacyName
    }));
  },

  removeProvider: () => {
    deliveryFormState.set(state => ({
      ...state,
      pharmacyId: 0,
      pharmacyName: ""
    }));
  },

  removeProcedure: (procedureId: string) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: state.procedureLines.filter(p => p.ProcedureId !== procedureId)
    }));
  },

  updateProcedureQuantity: (procedureId: string, quantity: number) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: state.procedureLines.map(p =>
        p.ProcedureId === procedureId ? { ...p, ProcedureQuantity: quantity } : p
      )
    }));
  },

  updateProcedureCost: (procedureId: string, cost: string) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: state.procedureLines.map(c =>
        c.ProcedureId === procedureId ? { ...c, cost: cost } : c
      )
    }));
  },

  setFormData: (data: any) => {

    // Handle diagnosis lines - check for both array and flattened structure
    let diagnosisLines: Diagnosis[] = [];

    if (data.DiagnosisLines && Array.isArray(data.DiagnosisLines)) {
      diagnosisLines = data.DiagnosisLines;
    } else if (data.DiagnosisName && data.DiagnosisId) {
      // Handle flattened structure
      diagnosisLines = [{
        DiagnosisName: data.DiagnosisName,
        DiagnosisId: data.DiagnosisId
      }];
    }

    // Handle procedure lines - check for both array and flattened structure
    let procedureLines: Procedure[] = [];

    if (data.ProcedureLines && Array.isArray(data.ProcedureLines)) {
      procedureLines = data.ProcedureLines;
    } else if (data.ProcedureName && data.ProcedureId) {
      // Handle flattened structure
      procedureLines = [{
        ProcedureName: data.ProcedureName,
        ProcedureId: data.ProcedureId,
        ProcedureQuantity: safeGet(data.ProcedureQuantity, 1),
        cost: safeGet(data.cost, "0")
      }];
    }

    // Transform the API response to match your form state structure
    const formData = {
      enrolleeId: safeGet(data.EnrolleeId, ""),
      enrolleeName: safeGet(data.EnrolleeName, ""),
      enrolleeAge: safeGet(data.EnrolleeAge, 0),
      schemeId: safeGet(data.SchemeId, ""),
      schemeName: safeGet(data.SchemeName, ""),
      deliveryaddress: safeGet(data.deliveryaddress, ""),
      phonenumber: safeGet(data.phonenumber, ""),
      cost: safeGet(data.cost, ""),

      // Handle pharmacy data with multiple possible field names
      pharmacyName: safeGet(data.PharmacyName, ""),
      pharmacyId: safeGet(data.PharmacyId || data.Pharmacyid, 0),

      deliveryFrequency: safeGet(data.DeliveryFrequency, ""),
      delStartDate: safeGet(data.DelStartDate, ""),
      nextDeliveryDate: safeGet(data.NextDeliveryDate, ""),
      frequencyDuration: safeGet(data.FrequencyDuration, ""),
      endDate: safeGet(data.EndDate, ""),

      diagnosisLines: diagnosisLines,
      procedureLines: procedureLines,

      additionalInformation: safeGet(data.AdditionalInformation, ""),
      dosageDescription: safeGet(data.DosageDescription, ""),
      comment: safeGet(data.comment, ""),
      Tobedeliverdby: safeGet(data.Tobedeliverdby, ""),


      currentStep: 1,
      totalSteps: 5,
      isEditing: true,
      entryno: safeGet(data.EntryNo, 0)
    };

    deliveryFormState.set(formData);
  },

  resetForm: () => {
    deliveryFormState.reset();
  },

  clearDeliveries: () => {
    deliveryStore.set(state => ({
      ...state,
      deliveries: [],
      isLoading: false,
      error: null,
      selectedEnrolleeId: null,
      lastSearchedEnrolleeId: null,
      showDetailView: false
    }));
  },

  submitForm: async (confirmDuplicates: boolean = false) => {
    try {
      deliveryStore.set(state => ({ ...state, isSubmitting: true }));
      const formData = deliveryFormState.get();
      const { user } = authStore.get();

      const delivery: Delivery = {
        EnrolleeId: formData.enrolleeId,
        EnrolleeName: formData.enrolleeName,
        EnrolleeAge: formData.enrolleeAge,
        SchemeId: formData.schemeId,
        SchemeName: formData.schemeName,
        DeliveryFrequency: formData.deliveryFrequency,
        DelStartDate: formData.delStartDate,
        NextDeliveryDate: formData.nextDeliveryDate,
        FrequencyDuration: formData.frequencyDuration,
        EndDate: formData.endDate,
        DiagnosisLines: formData.diagnosisLines,
        ProcedureLines: formData.procedureLines,
        AdditionalInformation: formData.additionalInformation,
        DosageDescription: formData.dosageDescription,
        Comment: formData.comment,
        IsDelivered: false,
        Username: user ? user.UserName : "Unknown",
        deliveryaddress: formData.deliveryaddress,
        phonenumber: formData.phonenumber,
        Pharmacyid: formData.pharmacyId,
        PharmacyName: formData.pharmacyName,
        cost: formData.cost,
        EntryNo: formData.isEditing ? formData.entryno : undefined,
      };

      const deliveryEdit = {
        EnrolleeId: formData.enrolleeId,
        EnrolleeName: formData.enrolleeName,
        EnrolleeAge: formData.enrolleeAge,
        SchemeId: formData.schemeId,
        SchemeName: formData.schemeName,
        DeliveryFrequency: formData.deliveryFrequency,
        DelStartDate: formData.delStartDate,
        NextDeliveryDate: formData.nextDeliveryDate,
        FrequencyDuration: formData.frequencyDuration,
        EndDate: formData.endDate,
        DiagnosisName: formData.diagnosisLines.length > 0 ? formData.diagnosisLines[0].DiagnosisName : "",
        DiagnosisId: formData.diagnosisLines.length > 0 ? formData.diagnosisLines[0].DiagnosisId : "",
        ProcedureName: formData.procedureLines.length > 0 ? formData.procedureLines[0].ProcedureName : "",
        ProcedureId: formData.procedureLines.length > 0 ? formData.procedureLines[0].ProcedureId : "",
        ProcedureQuantity: formData.procedureLines.length > 0 ? formData.procedureLines[0].ProcedureQuantity : 1,
        cost: formData.procedureLines.length > 0 ? (formData.procedureLines[0].cost || formData.cost || "0") : (formData.cost || "0"),
        AdditionalInformation: formData.additionalInformation,
        DosageDescription: formData.dosageDescription,
        Comment: formData.comment,
        IsDelivered: false,
        Username: user ? user.UserName : "Unknown",
        deliveryaddress: formData.deliveryaddress,
        phonenumber: formData.phonenumber,
        Pharmacyid: formData.pharmacyId,
        PharmacyName: formData.pharmacyName,
        EntryNo: formData.isEditing ? formData.entryno : undefined,
      };

      const { editDelivery, createDelivery } = await import("@/lib/services/delivery-service");

      let response;

      if (formData.isEditing) {
        response = await editDelivery(deliveryEdit);
      } else {
        const formattedData = {
          Deliveries: [delivery],
          ConfirmDuplicates: confirmDuplicates
        };
        const shouldSkipNavigation = !confirmDuplicates;

        response = await createDelivery(formattedData, shouldSkipNavigation);
      }


      // Check for duplicate procedures using the correct response structure
      if (!confirmDuplicates && !formData.isEditing) {
        // Check if we have the nested result structure with duplicate detection
        const result = response.result || response;
        const isDuplicateResponse = result.RequiresConfirmation === true ||
          (result.status === 409 && result.ReturnMessage &&
            result.ReturnMessage.toLowerCase().includes("duplicate"));

        if (isDuplicateResponse) {
          const warnings = result.Warnings || [];
          const duplicateDeliveries = warnings.map((warning: string, index: number) => {
            // Extract information from warning message
            // Warning format: "Warning: Procedure 'IRON SUCROSE 200MG INJ' (ID: B0320011) already exists for Enrollee 'Mrs Favour Mbaekwe' (ID: 21000645/0) with overlapping dates. Existing end date: 2025-10-12, New start date: 2025-07-12"

            const procedureNameMatch = warning.match(/Procedure '([^']+)'/);
            const procedureIdMatch = warning.match(/\(ID: ([^)]+)\)/);
            const enrolleeNameMatch = warning.match(/Enrollee '([^']+)'/);
            const enrolleeIdMatch = warning.match(/Enrollee '[^']+' \(ID: ([^)]+)\)/);
            const endDateMatch = warning.match(/Existing end date: ([^,]+)/);
            const startDateMatch = warning.match(/New start date: ([^"]+)/);

            return {
              DeliveryId: `DUPLICATE-${index + 1}`,
              EnrolleeName: enrolleeNameMatch ? enrolleeNameMatch[1] : formData.enrolleeName,
              EnrolleeId: enrolleeIdMatch ? enrolleeIdMatch[1] : formData.enrolleeId,
              DeliveryFrequency: "Existing Delivery", // We don't have this info in warning
              EndDate: endDateMatch ? endDateMatch[1].trim() : "Unknown",
              StartDate: startDateMatch ? startDateMatch[1].trim() : "Unknown",
              ProcedureLines: [{
                ProcedureName: procedureNameMatch ? procedureNameMatch[1] : "Unknown Procedure",
                ProcedureId: procedureIdMatch ? procedureIdMatch[1] : "Unknown",
                ProcedureQuantity: 1
              }]
            };
          });

          deliveryActions.openDuplicateModal(duplicateDeliveries);

          return response;
        }

        // Fallback: Check original response structure
        if (response.Deliveries && response.Deliveries.length > 0) {
          const existingDeliveries = response.Deliveries.filter((d: any) => d.DeliveryId !== null);

          if (existingDeliveries.length > 0) {
            deliveryActions.openDuplicateModal(existingDeliveries);

            return response;
          }
        }
      }

      // Handle actual errors (not duplicate warnings)
      const result = response.result || response;
      const isSuccess = response.status === 200 && (!result.status || result.status === 200 || result.status === 409);
      const hasErrors = result.Errors?.length > 0;

      if (!isSuccess || hasErrors) {
        const isDuplicateMessage = result.ReturnMessage &&
          result.ReturnMessage.toLowerCase().includes("duplicate");

        // Only show error toast if it's not a duplicate message
        if (!isDuplicateMessage) {
          toast.error(result.ReturnMessage ||
            (formData.isEditing ? "Failed to update delivery" : "Failed to create delivery"));
        }

        return response;
      }

      // Success handling
      if (confirmDuplicates) {
        toast.success("Delivery created successfully with duplicate confirmation!", {
          icon: "⚠️",
          duration: 4000,
        });
      } else {
        toast.success(response.ReturnMessage ||
          (formData.isEditing ? "Delivery updated successfully!" : "Delivery created successfully!"));
      }

      deliveryActions.closeModal();
      deliveryActions.closeDuplicateModal();
      deliveryFormState.reset();

      // Refresh deliveries
      const { enrolleeId } = appChunk.get();

      getDeliveries("", enrolleeId);

      return response;
    } catch (error) {
      toast.error(`Error submitting delivery: ${error}`);

      return { status: 500, ReturnMessage: "An unexpected error occurred", Errors: [] };
    } finally {
      deliveryStore.set(state => ({ ...state, isSubmitting: false }));
    }
  },

  handleDuplicateConfirmation: (confirm: boolean) => {
    if (confirm) {
      // User confirmed they want to create duplicate
      deliveryActions.submitForm(true);
    } else {
      // User cancelled, close the duplicate modal
      deliveryActions.closeDuplicateModal();
    }
  },

  resetDeliveryErrors: () => {
    deliveryStore.set(state => ({
      ...state,
      error: null,
      packingError: null,
      packingSuccess: false,
    }));
  },

  setPackingSuccess: (success: boolean) => {
    deliveryStore.set(state => ({
      ...state,
      packingSuccess: success,
    }));
  },

  updateLastSearchedEnrolleeId: (enrolleeId: string) => {
    deliveryStore.set(state => ({
      ...state,
      lastSearchedEnrolleeId: enrolleeId,
    }));
  }
};
