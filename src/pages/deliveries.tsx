import { useCallback, useEffect, useRef, useState } from "react";
import { useChunkValue } from "stunk/react";
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
import ProgressStep from "@/components/deliveries/progress-step";
import BenefitTable from "@/components/benefits-table";
import DuplicateModal from "@/components/deliveries/duplicate-modal";
import DeliveryTable from "@/components/delivery-table";

export default function DeliveriesPage() {
  const {
    deliveries,
    isLoading,
    error,
    showModal,
    isSubmitting,
    pendingSubmission,
  } = useChunkValue(deliveryStore);
  const formState = useChunkValue(deliveryFormState);
  const { searchCriteria, enrolleeData } = useChunkValue(appChunk);

  // State for Benefits Modal
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [benefitsData, setBenefitsData] = useState<EnrolleeBenefitData[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [benefitsError, setBenefitsError] = useState<string>("");

  // State for search filters
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [currentSearchType, setCurrentSearchType] = useState<
    "enrollee" | "phone" | "email" | "pharmacy" | "code"
  >("enrollee");
  const [currentShowAll, setCurrentShowAll] = useState(false);

  const lastSearchRef = useRef<string>("");
  const isFetchingRef = useRef<boolean>(false);

  const getDeliveriesWithFilters = useCallback(
    async (
      searchTerm: string = "",
      searchType:
        | "enrollee"
        | "phone"
        | "email"
        | "pharmacy"
        | "code" = "enrollee",
      showAll: boolean = false
    ) => {
      const searchKey = `${searchTerm}-${searchType}-${showAll}`;

      if (lastSearchRef.current === searchKey || isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      lastSearchRef.current = searchKey;

      try {
        let enrolleeId = "";
        let phone = "";
        let email = "";
        let pharmacyid = "";
        let codetopharmacy = "";

        // If showAll is true, ignore other filters
        if (showAll) {
          await getDeliveries("", "", "", "", "", true);
          return;
        }

        // Map search type to API parameters
        switch (searchType) {
          case "enrollee":
            enrolleeId = searchTerm;
            break;
          case "phone":
            phone = searchTerm;
            break;
          case "email":
            email = searchTerm;
            break;
          case "pharmacy":
            pharmacyid = searchTerm;
            break;
          case "code":
            codetopharmacy = searchTerm;
            break;
        }

        // If no search term and no enrollee selected, show all
        if (!searchTerm && !searchCriteria.enrolleeId) {
          await getDeliveries("", "", "", "", "", true);
        } else if (!searchTerm && searchCriteria.enrolleeId) {
          enrolleeId = searchCriteria.enrolleeId;
          await getDeliveries(enrolleeId, "", "", "", "", false);
        } else {
          await getDeliveries(
            enrolleeId,
            phone,
            email,
            pharmacyid,
            codetopharmacy,
            false
          );
        }
      } catch (error) {
        toast.error(`Error fetching deliveries: ${error}`);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [searchCriteria.enrolleeId]
  );

  useEffect(() => {
    // Initial load based on enrollee selection
    if (searchCriteria.enrolleeId) {
      getDeliveriesWithFilters(searchCriteria.enrolleeId, "enrollee", false);
    } else {
      // Show all deliveries if no enrollee is selected
      getDeliveriesWithFilters("", "enrollee", true);
    }

    return () => {
      deliveryActions.clearDeliveries();
      lastSearchRef.current = "";
      isFetchingRef.current = false;
    };
  }, [searchCriteria.enrolleeId, getDeliveriesWithFilters]);

  const handleSearch = (
    searchTerm: string,
    searchType?: "enrollee" | "phone" | "email" | "pharmacy" | "code",
    showAll?: boolean
  ) => {
    const finalSearchType = searchType || currentSearchType;
    const finalShowAll = showAll !== undefined ? showAll : currentShowAll;

    setCurrentSearchTerm(searchTerm);
    setCurrentSearchType(finalSearchType);
    setCurrentShowAll(finalShowAll);
    getDeliveriesWithFilters(searchTerm, finalSearchType, finalShowAll);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      deliveryActions.openModal();

      // Auto-generate delivery code for new deliveries
      if (!formState.isEditing) {
        const generateRandomCode = () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        };
        const generatedCode = generateRandomCode();

        deliveryActions.updateFormField("deliveryaddress", generatedCode);
      }
    } else {
      deliveryActions.closeModal();
      if (!formState.isEditing) {
        deliveryFormState.reset();
      }
    }
  };

  const handleSubmit = () => {
    if (formState.currentStep < formState.totalSteps) {
      deliveryActions.nextStep();
    } else {
      deliveryActions.submitForm(false);
    }
  };

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
        enrolleeData.Member_MemberUniqueID
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

  const renderFormStep = () => {
    switch (formState.currentStep) {
      case 1:
        return <EnrolleeSelectionStep />;
      case 2:
        return <ProviderSetup />;
      case 3:
        return <DiagnosisProcedureStep />;
      case 4:
        return <AdditionalInfoStep />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        description="Manage and view delivery information"
        title="Deliveries"
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
                onPress={deliveryActions.openModal}
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
            <p>Loading deliveries...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <DeliveryTable
            currentSearchTerm={currentSearchTerm}
            currentSearchType={currentSearchType}
            currentShowAll={currentShowAll}
            deliveries={deliveries}
            isLoading={isLoading}
            onSearch={handleSearch}
          />
        )}

        {/* Main Form Modal */}
        <Modal
          backdrop="blur"
          isDismissable={false}
          isOpen={showModal}
          scrollBehavior="outside"
          shouldCloseOnInteractOutside={(element) => {
            return !element.className.includes("heroui-select");
          }}
          size="3xl"
          onOpenChange={handleOpenChange}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              {formState.isEditing ? "Edit Delivery" : "Create Delivery"} - Step{" "}
              {formState.currentStep} of {formState.totalSteps}
            </ModalHeader>
            <ModalBody>
              <ProgressStep />
              {renderFormStep()}
            </ModalBody>
            <ModalFooter>
              <div className="flex justify-between w-full">
                {formState.currentStep > 1 && (
                  <Button
                    color="default"
                    radius="sm"
                    onPress={deliveryActions.prevStep}
                  >
                    Previous
                  </Button>
                )}
                <div className="ml-auto">
                  <Button
                    color="primary"
                    isDisabled={isSubmitting}
                    isLoading={isSubmitting && !pendingSubmission}
                    radius="sm"
                    onPress={handleSubmit}
                  >
                    {formState.currentStep < formState.totalSteps
                      ? "Next"
                      : "Submit"}
                  </Button>
                </div>
              </div>
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
