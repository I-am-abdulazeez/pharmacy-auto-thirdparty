import { useCallback, useEffect, useRef, useState } from "react";
import { useChunk, useChunkValue } from "stunk/react";
import { Button } from "@heroui/button";
import toast from "react-hot-toast";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";

import PageHeader from "@/components/ui/page-header";
import { appChunk } from "@/lib/store/app-store";
import {
  deliveryActions,
  deliveryFormState,
  deliveryStore,
} from "@/lib/store/delivery-store";
import {
  EnrolleeBenefitData,
  getEnrolleeBenefitsBycif,
} from "@/lib/services/enrollee-service";
import { getDeliveries } from "@/lib/services/delivery-service";
import EnrolleeSelectionStep from "@/components/enrollee-setup";
import ProviderSetup from "@/components/deliveries/provider-setup";
import DiagnosisProcedureStep from "@/components/deliveries/procedure-setup";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";
import BenefitTable from "@/components/benefits-table";
import DuplicateModal from "@/components/deliveries/duplicate-modal";
import DeliveryTable from "@/components/delivery-table";
import DeliveryDetailsStep from "@/components/deliveries/details-setup";

interface SearchFilters {
  enrollee: string;
  phone: string;
  email: string;
  pharmacy: string;
  code: string;
  showAll: boolean;
}

export default function DeliveriesPage() {
  const {
    deliveries,
    isLoading,
    error,
    showModal,
    isSubmitting,
    pendingSubmission,
  } = useChunkValue(deliveryStore);
  const [formState, setFormState] = useChunk(deliveryFormState);
  const { searchCriteria, enrolleeData } = useChunkValue(appChunk);

  // State for Benefits Modal
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [benefitsData, setBenefitsData] = useState<EnrolleeBenefitData[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitsError, setBenefitsError] = useState<string>("");

  // NEW: State for medication type selection
  const [showMedicationTypeModal, setShowMedicationTypeModal] = useState(false);
  const [medicationType, setMedicationType] = useState<Set<string>>(new Set());
  const [selectedMedicationType, setSelectedMedicationType] = useState<
    "Acute" | "Routine" | null
  >(null);

  // State for search filters
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    enrollee: "",
    phone: "",
    email: "",
    pharmacy: "",
    code: "",
    showAll: searchCriteria.enrolleeId ? true : false,
  });

  const lastSearchRef = useRef<string>("");
  const isFetchingRef = useRef<boolean>(false);

  const getDeliveriesWithFilters = useCallback(
    async (filters: SearchFilters, forceRefresh = false) => {
      const searchKey = JSON.stringify(filters);

      // Skip duplicate check if forceRefresh is true
      if (
        !forceRefresh &&
        (lastSearchRef.current === searchKey || isFetchingRef.current)
      ) {
        return;
      }

      isFetchingRef.current = true;
      lastSearchRef.current = searchKey;

      try {
        // Check if any filter has a value
        const hasFilters =
          filters.enrollee ||
          filters.phone ||
          filters.email ||
          filters.pharmacy ||
          filters.code;

        // If showAll is true, pass it as true regardless of filters
        // If showAll is false and there are filters, pass false
        // If showAll is false and no filters, pass true (default behavior)
        const showAll = filters.showAll || !hasFilters;

        await getDeliveries(
          filters.enrollee,
          filters.phone,
          filters.email,
          filters.pharmacy,
          filters.code,
          showAll,
        );
      } catch (error) {
        toast.error(`Error fetching deliveries: ${error}`);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    // Initial load based on enrollee selection
    const initialFilters: SearchFilters = {
      enrollee: searchCriteria.enrolleeId || "",
      phone: "",
      email: "",
      pharmacy: "",
      code: "",
      showAll: true,
    };

    setCurrentFilters(initialFilters);
    getDeliveriesWithFilters(initialFilters);

    return () => {
      deliveryActions.clearDeliveries();
      lastSearchRef.current = "";
      isFetchingRef.current = false;
    };
  }, [searchCriteria.enrolleeId, getDeliveriesWithFilters]);

  const handleSearch = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    getDeliveriesWithFilters(filters);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Show medication type selection modal first
      setShowMedicationTypeModal(true);
    } else {
      deliveryActions.closeModal();
      if (!formState.isEditing) {
        deliveryFormState.reset();
      }
      // Reset medication type selection
      setSelectedMedicationType(null);
    }
  };

  const handleMedicationTypeSelect = () => {
    const selectedType = Array.from(medicationType)[0];

    if (!selectedType) {
      toast.error("Please select a medication type");

      return;
    }

    // Store the selected type in local state
    setSelectedMedicationType(selectedType as "Acute" | "Routine");

    // Set the delivery frequency based on selection
    const frequency = selectedType === "Acute" ? "One-off" : "Routine";

    // Auto-generate delivery code
    const generateRandomCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    const generatedCode = generateRandomCode();

    // Update form state
    setFormState((state) => ({
      ...state,
      deliveryFrequency: frequency,
      deliveryaddress: generatedCode,
    }));

    // Close medication type modal
    setShowMedicationTypeModal(false);

    // Open main modal immediately
    deliveryActions.openModal();
  };

  const handleMedicationTypeModalClose = () => {
    setShowMedicationTypeModal(false);
    setMedicationType(new Set());
    setSelectedMedicationType(null);
  };

  const handleSubmit = () => {
    // Submit the form for both Acute and Routine (both are single-step now)
    if (formState.deliveryFrequency == "Acute") {
      deliveryActions.submitAcuteForm(false);
    } else {
      deliveryActions.submitRoutineForm(false);
    }
  };

  const handleRefresh = useCallback(() => {
    getDeliveriesWithFilters(currentFilters, true);
  }, [currentFilters, getDeliveriesWithFilters]);

  const handleSeeLimitClick = async () => {
    if (!enrolleeData?.Member_MemberUniqueID) {
      setBenefitsError("No member ID found");
      setShowBenefitsModal(true);

      return;
    }

    setBenefitsLoading(true);
    setBenefitsError("");
    setShowBenefitsModal(true);

    try {
      const response = await getEnrolleeBenefitsBycif(
        enrolleeData.Member_MemberUniqueID,
      );

      if (response && response.result) {
        setBenefitsData(response.result);
      } else {
        setBenefitsError("No benefits data found");
        setBenefitsData([]);
      }
    } catch (error) {
      toast.error(`Error fetching benefits: ${error}`);
      setBenefitsError("Failed to load benefits data");
      setBenefitsData([]);
    } finally {
      setBenefitsLoading(false);
    }
  };

  const handleBenefitsModalClose = () => {
    setShowBenefitsModal(false);
    setBenefitsData([]);
    setBenefitsError("");
  };

  return (
    <>
      <PageHeader
        description="Manage and view pickup information"
        title="Pickup"
      />
      <section className="px-2">
        <div className="flex justify-end mb-4 gap-2">
          {searchCriteria.enrolleeId !== "" ||
          searchCriteria.firstName !== "" ||
          searchCriteria.lastName !== "" ||
          searchCriteria.mobileNo !== "" ||
          searchCriteria.email !== "" ? (
            <>
              <Button
                color="secondary"
                radius="md"
                onPress={handleSeeLimitClick}
              >
                See Limit
              </Button>
              <Button
                color="primary"
                radius="md"
                onPress={() => setShowMedicationTypeModal(true)}
              >
                Create Delivery
              </Button>
            </>
          ) : (
            <p className="text-medium">Select an Enrollee to Create Delivery</p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <Spinner color="warning" />
            <p>Loading Pickups...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <DeliveryTable
            currentFilters={currentFilters}
            deliveries={deliveries}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
          />
        )}

        {/* Medication Type Selection Modal */}
        <Modal
          backdrop="blur"
          isDismissable={false}
          isOpen={showMedicationTypeModal}
          size="md"
          onClose={handleMedicationTypeModalClose}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Medication Setup
            </ModalHeader>
            <ModalBody>
              <Select
                label="Select Medication Type"
                placeholder="Choose medication type"
                selectedKeys={medicationType}
                onSelectionChange={(keys) =>
                  setMedicationType(keys as Set<string>)
                }
              >
                <SelectItem key="Acute">Acute</SelectItem>
                <SelectItem key="Routine">Routine Refill</SelectItem>
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={handleMedicationTypeModalClose}
              >
                Cancel
              </Button>
              <Button color="primary" onPress={handleMedicationTypeSelect}>
                Continue
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Main Form Modal - Single-step for both Acute and Routine */}
        <Modal
          backdrop="blur"
          isDismissable={false}
          isOpen={showModal}
          scrollBehavior="inside"
          shouldCloseOnInteractOutside={(element) => {
            return !element.className.includes("heroui-select");
          }}
          size="3xl"
          onOpenChange={handleOpenChange}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              {formState.isEditing
                ? "Edit Delivery"
                : selectedMedicationType === "Routine"
                  ? "Request Chronic"
                  : "Request Acute"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Section 1: Enrollee Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    1. Enrollee Information
                  </h3>
                  <EnrolleeSelectionStep />
                </div>

                {/* Section 2: Delivery Details - Only show for Routine */}
                {selectedMedicationType === "Routine" && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                      2. Delivery Details
                    </h3>
                    <DeliveryDetailsStep />
                  </div>
                )}

                {/* Section 2/3: Provider/Pharmacy Setup */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    {selectedMedicationType === "Routine" ? "3" : "2"}. Provider
                    & Pharmacy Setup
                  </h3>
                  <ProviderSetup />
                </div>

                {/* Section 3/4: Diagnosis & Procedures */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    {selectedMedicationType === "Routine" ? "4" : "3"}.
                    Diagnosis & Procedures
                  </h3>
                  <DiagnosisProcedureStep />
                </div>

                {/* Section 4/5: Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    {selectedMedicationType === "Routine" ? "5" : "4"}.
                    Additional Information
                  </h3>
                  <AdditionalInfoStep />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={isSubmitting}
                isLoading={isSubmitting && !pendingSubmission}
                radius="sm"
                onPress={handleSubmit}
              >
                {formState.isEditing
                  ? "Update Delivery"
                  : selectedMedicationType === "Routine"
                    ? "Submit"
                    : "Create Delivery"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Benefits Modal */}
        <Modal
          backdrop="blur"
          isOpen={showBenefitsModal}
          scrollBehavior="inside"
          size="5xl"
          onClose={handleBenefitsModalClose}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Enrollee Benefits & Limits
            </ModalHeader>
            <ModalBody>
              <BenefitTable
                benefitsData={benefitsData}
                error={benefitsError}
                loading={benefitsLoading}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={handleBenefitsModalClose}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <DuplicateModal />
      </section>
    </>
  );
}
