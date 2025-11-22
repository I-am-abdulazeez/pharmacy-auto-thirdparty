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
  enrolleeEmail: "",
  scheme_type: "",
  schemeId: "",
  schemeName: "",
  deliveryaddress: "",
  phonenumber: "",
  cost: "",
  Tobedeliverdby: "",

  pharmacyId: 9999,
  pharmacyName: "",

  prescriptionFile: null as File | null,

  deliveryFrequency: "",
  delStartDate: "" as string | null,
  nextDeliveryDate: "" as string | null,
  frequencyDuration: "",
  endDate: "" as string | null,

  diagnosisLines: [] as Diagnosis[],
  procedureLines: [] as Procedure[],

  additionalInformation: "",
  dosageDescription: "",
  comment: "",


  currentStep: 1,
  totalSteps: 3,
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
      procedureLines = [{
        ProcedureName: data.ProcedureName,
        ProcedureId: data.ProcedureId,
        ProcedureQuantity: safeGet(data.ProcedureQuantity, 1),
        cost: safeGet(data.cost, "0"),
        DosageDescription: safeGet(data.DosageDescription, "")
      }];
    }

    // Transform the data to match form state structure
    // This works with the transformed Delivery type

    const formData = {
      enrolleeId: safeGet(data.EnrolleeId, ""),
      enrolleeName: safeGet(data.EnrolleeName, ""),
      enrolleeEmail: safeGet(data.EnrolleeEmail || data.email, ""),
      enrolleeAge: safeGet(data.EnrolleeAge, 0),
      schemeId: safeGet(data.SchemeId, ""),
      schemeName: safeGet(data.SchemeName, ""),
      scheme_type: safeGet(data.scheme_type, ""),
      deliveryaddress: safeGet(data.deliveryaddress, ""),
      phonenumber: safeGet(data.phonenumber, ""),
      cost: safeGet(data.cost, ""),

      // Handle pharmacy data
      pharmacyName: safeGet(data.pharmacyname, ""),
      pharmacyId: safeGet(data.pharmacyid, ""),

      deliveryFrequency: safeGet(data.DeliveryFrequency, ""),
      delStartDate: safeGet(data.DelStartDate, ""),
      nextDeliveryDate: safeGet(data.NextDeliveryDate, ""),
      frequencyDuration: safeGet(data.FrequencyDuration, ""),
      endDate: safeGet(data.EndDate, ""),

      diagnosisLines: diagnosisLines,
      procedureLines: procedureLines,

      additionalInformation: safeGet(data.AdditionalInformation, ""),
      dosageDescription: safeGet(data.DosageDescription, ""),
      comment: safeGet(data.Comment, ""),
      Tobedeliverdby: safeGet(data.Tobedeliverdby, ""),

      currentStep: 1,
      totalSteps: 3,
      isEditing: true,
      entryno: safeGet(data.EntryNo, 0),
      prescriptionFile: null as File | null,
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

      const delivery = {
        EnrolleeId: formData.enrolleeId,
        EnrolleeName: formData.enrolleeEmail,
        EnrolleeEmail: formData.enrolleeEmail,
        EnrolleeAge: formData.enrolleeAge,
        SchemeId: formData.schemeId,
        SchemeName: formData.schemeName,
        DeliveryFrequency: formData.deliveryFrequency,
        DelStartDate: "2025-10-14T00:00:00",
        NextDeliveryDate: "2025-10-21T00:00:00",
        EndDate: "2025-11-14T00:00:00",
        FrequencyDuration: formData.enrolleeEmail,
        DiagnosisLines: formData.diagnosisLines,
        ProcedureLines: formData.procedureLines,
        AdditionalInformation: formData.additionalInformation,
        DosageDescription: formData.dosageDescription,
        Comment: formData.comment,
        IsDelivered: false,
        Username: user?.UserName || "",
        deliveryaddress: formData.deliveryaddress,
        phonenumber: formData.phonenumber,
        Pharmacyid: formData.pharmacyId,
        PharmacyName: formData.pharmacyName,
        cost: formData.cost,
        EntryNo: formData.isEditing ? formData.entryno : undefined,
      };

      const deliveryEdit = {
        EnrolleeId: formData.enrolleeId,
        EnrolleeAge: formData.enrolleeAge,
        SchemeId: formData.schemeId,
        SchemeName: formData.schemeName,
        scheme_type: formData.scheme_type,
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
        Username: formData.enrolleeEmail,
        deliveryaddress: formData.deliveryaddress,
        phonenumber: formData.phonenumber,
        Pharmacyid: formData.pharmacyId,
        PharmacyName: formData.pharmacyName,
        EntryNo: formData.isEditing ? formData.entryno : undefined,
      };

      const { editDelivery, createDelivery } = await import("@/lib/services/delivery-service");
      // const { sendSms } = await import("@/lib/services/sms-service");
      const { sendPhaEmailAlert } = await import("@/lib/services/mail-service");

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

      // Check for duplicate procedures
      if (!confirmDuplicates && !formData.isEditing) {
        const result = response.result || response;
        const isDuplicateResponse = result.RequiresConfirmation === true ||
          (result.status === 409 && result.ReturnMessage &&
            result.ReturnMessage.toLowerCase().includes("duplicate"));

        if (isDuplicateResponse) {
          const warnings = result.Warnings || [];
          const duplicateDeliveries = warnings.map((warning: string, index: number) => {
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
              DeliveryFrequency: "Existing Delivery",
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

        if (response.Deliveries && response.Deliveries.length > 0) {
          const existingDeliveries = response.Deliveries.filter((d: any) => d.DeliveryId !== null);

          if (existingDeliveries.length > 0) {
            deliveryActions.openDuplicateModal(existingDeliveries);

            return response;
          }
        }
      }

      // Handle errors
      const result = response.result || response;
      const isSuccess = response.status === 200 && (!result.status || result.status === 200 || result.status === 409);
      const hasErrors = result.Errors?.length > 0;

      if (!isSuccess || hasErrors) {
        const isDuplicateMessage = result.ReturnMessage &&
          result.ReturnMessage.toLowerCase().includes("duplicate");

        if (!isDuplicateMessage) {
          toast.error(result.ReturnMessage ||
            (formData.isEditing ? "Failed to update delivery" : "Failed to create delivery"));
        }

        return response;
      }

      // Success handling - Send SMS and Email for new deliveries
      if (!formData.isEditing) {
        // let smsSuccess = false;
        let emailSuccess = false;

        // // Send SMS
        // if (formData.phonenumber && formData.deliveryaddress) {
        //   try {
        //     const smsMessage = `Your pharmacy pickup code is: ${formData.deliveryaddress}. Please use this code to collect your medication. Thank you.`;

        //     const smsPayload = {
        //       To: formData.phonenumber,
        //       Message: smsMessage,
        //       Source: "Pharmacy Delivery",
        //       SourceId: user?.User_id || 0,
        //       TemplateId: 0,
        //       PolicyNumber: formData.enrolleeId,
        //       ReferenceNo: formData.deliveryaddress,
        //       UserId: user?.User_id || 0,
        //     };

        //     await sendSms(smsPayload);
        //     smsSuccess = true;
        //   } catch (smsError) {
        //     toast.error(`SMS failed to send: ${smsError}`);
        //   }
        // }

        // Send Email
        if (formData.enrolleeEmail) {
          try {
            const procedureNames = formData.procedureLines.map(p => p.ProcedureName);
            const diagnosisNames = formData.diagnosisLines.map(d => d.DiagnosisName);

            const emailTemplateData = {
              procedureName: procedureNames,
              diagnosisName: diagnosisNames,
              enrolleeName: formData.enrolleeName,
              enrolleeId: formData.enrolleeId,
              deliveryAddress: formData.deliveryaddress,
              phoneNumber: formData.phonenumber,
              deliveryFrequency: formData.deliveryFrequency,
              startDate: formData.delStartDate || "",
              nextDeliveryDate: formData.nextDeliveryDate || "",
              endDate: formData.endDate || "",
              pharmacyName: formData.pharmacyName,
              cost: formData.cost,
              dosageDescription: formData.dosageDescription,
              additionalInformation: formData.additionalInformation,
              comment: formData.comment,
            };

            await sendPhaEmailAlert(emailTemplateData, formData.prescriptionFile);
            emailSuccess = true;
            toast.success("Email sent successfully to pharmacy.");
          } catch (emailError) {
            toast.error(`Email failed to send: ${emailError}`);
          }
        }

        // Show appropriate success message
        // if (smsSuccess && emailSuccess) {
        if (emailSuccess) {
          if (confirmDuplicates) {
            toast.success("Delivery created with duplicate confirmation. SMS and Email sent!", {
              duration: 4000,
            });
          } else {
            toast.success("Delivery created! SMS and Email sent successfully!");
          }
          // } else if (smsSuccess || emailSuccess) {
        } else if (emailSuccess) {
          // const sentItems = [smsSuccess && "SMS", emailSuccess && "Email"].filter(Boolean).join(" and ");
          const sentItems = [emailSuccess && "Email"].filter(Boolean).join(" and ");

          toast.success(`Delivery created! ${sentItems} sent successfully.`);
        } else if (confirmDuplicates) {
          toast.success("Delivery created with duplicate confirmation!", {
            icon: "⚠️",
            duration: 4000,
          });
        } else {
          toast.success("Delivery created successfully!");
        }
      } else {
        toast.success(response.ReturnMessage || "Delivery updated successfully!");
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
