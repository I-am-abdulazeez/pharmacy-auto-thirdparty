import { useEffect, useState, useCallback, useMemo } from "react";
import { useChunkValue } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Selection } from "@heroui/table";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import toast from "react-hot-toast";

import {
  getProviderPickups,
  getPickupDetails,
} from "@/lib/services/delivery-service";
import {
  deliveryStore,
  deliveryActions,
  deliveryFormState,
} from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import PayAutoLineTable from "@/components/pay-autoline-table";
import PageHeader from "@/components/ui/page-header";
import { DownloadIcon } from "@/components/icons";
import ProviderPickupsTable from "@/components/pickup/provider-pickup-table";
import EnrolleeSelectionStep from "@/components/enrollee-setup";
import ProviderSetup from "@/components/deliveries/provider-setup";
import DiagnosisProcedureStep from "@/components/deliveries/procedure-setup";
import AdditionalInfoStep from "@/components/deliveries/additional-setup";
import AssignPharmacyModal from "@/components/assign-pendings/assign-pharmacy-modal";
import { payAutoLine } from "@/lib/services/payautoline-services";
import { downloadTableAsExcel } from "@/lib/utils/excel-exports";
import { sendPhaEmailAlert } from "@/lib/services/mail-service";
import { sendSms } from "@/lib/services/sms-service";
import { generateRandomCode } from "@/lib/utils";

export default function PendingCollectionsPage() {
  const {
    providerPickups,
    pickupDetails,
    isLoading,
    isLoadingDetails,
    error,
    detailsError,
    showModal,
    isSubmitting,
  } = useChunkValue(deliveryStore);
  const formState = useChunkValue(deliveryFormState);
  const { user } = useChunkValue(authStore);
  const [showAll, setShowAll] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [searchEnrolleeId, setSearchEnrolleeId] = useState("");
  const [selectedEnrolleeId, setSelectedEnrolleeId] = useState<string | null>(
    null,
  );
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  // NEW: State to preserve pagination
  const [currentPage, setCurrentPage] = useState(1);

  const pharmacyId = user?.provider_id?.toString() || "";

  // Calculate selected deliveries for Assign Pharmacy functionality
  const selectedDeliveries = useMemo(() => {
    if (selectedKeys === "all") {
      return pickupDetails || [];
    }

    return (pickupDetails || []).filter((delivery: any) => {
      const key = String(delivery.EntryNo);

      return (selectedKeys as Set<string>).has(key);
    });
  }, [selectedKeys, pickupDetails]);

  // Fetch initial pickups list
  useEffect(() => {
    if (pharmacyId) {
      getProviderPickups(pharmacyId, showAll);
    }
  }, [showAll, pharmacyId]);

  const handleRowClick = (enrolleeId: string) => {
    setSelectedEnrolleeId(enrolleeId);
    getPickupDetails(pharmacyId, enrolleeId, showAll);
  };

  const handleRefresh = useCallback(() => {
    if (selectedEnrolleeId) {
      // Force refresh by clearing the state first, then fetching again
      deliveryStore.set((state) => ({
        ...state,
        pickupDetails: [],
        isLoadingDetails: true,
      }));

      // Use setTimeout to ensure state update happens before fetch
      setTimeout(() => {
        getPickupDetails(pharmacyId, selectedEnrolleeId, showAll);
      }, 100);
    }
  }, [selectedEnrolleeId, pharmacyId, showAll]);

  const handleSearch = () => {
    if (pharmacyId) {
      getProviderPickups(pharmacyId, false, searchEnrolleeId);
    }
  };

  const handleClearSearch = () => {
    setSearchEnrolleeId("");
    if (pharmacyId) {
      getProviderPickups(pharmacyId, false);
    }
  };

  const handleBackToList = () => {
    setSelectedEnrolleeId(null);
    setSelectedKeys(new Set()); // Clear selections
    deliveryStore.set((state) => ({
      ...state,
      pickupDetails: [],
      detailsError: null,
    }));

    // Always fetch fresh data when going back to list
    if (pharmacyId) {
      getProviderPickups(pharmacyId, showAll);
    }
    // NOTE: We DON'T reset currentPage here - it stays on the same page!
  };

  const handleDownloadExcel = () => {
    downloadTableAsExcel(pickupDetails || [], showAll);
  };

  const handleRetry = () => {
    if (selectedEnrolleeId) {
      getPickupDetails(pharmacyId, selectedEnrolleeId, showAll);
    } else {
      getProviderPickups(pharmacyId, showAll);
    }
  };

  const handlePaySelected = useCallback(
    async (selectedDeliveries: any[], totalCost: number) => {
      if (selectedDeliveries.length === 0) {
        toast.error("Please select at least one delivery to pay");

        return;
      }

      const enrolleeIdFromDelivery =
        selectedDeliveries[0]?.EnrolleeId || selectedEnrolleeId || "";

      if (!enrolleeIdFromDelivery) {
        toast.error("Unable to find enrollee ID for selected deliveries");

        return;
      }

      // Use first delivery for common enrollee info
      const firstDelivery = selectedDeliveries[0];

      // Generate pickup code (shared for all deliveries for this enrollee)
      const pickupCode = firstDelivery.codetopharmacy || generateRandomCode();

      // Validate phone number
      if (!firstDelivery.phonenumber) {
        toast.error("Phone number is missing. Cannot send notifications.");

        return;
      }

      // Aggregate ALL procedures and diagnoses from ALL selected deliveries
      const procedureNames = selectedDeliveries
        .flatMap((d) => d.ProcedureLines || [])
        .map((p) => p.ProcedureName)
        .filter(Boolean);

      const diagnosisNames = selectedDeliveries
        .flatMap((d) => d.DiagnosisLines || [])
        .map((d) => d.DiagnosisName)
        .filter(Boolean);

      // Aggregate dosage descriptions
      const dosageDescriptions = selectedDeliveries
        .map((d) => d.DosageDescription)
        .filter(Boolean)
        .join("; ");

      // Build email template with aggregated data
      const emailTemplateData = {
        procedureName: procedureNames,
        diagnosisName: diagnosisNames,
        enrolleeName: firstDelivery.EnrolleeName || "",
        enrolleeId: firstDelivery.EnrolleeId || "",
        deliveryAddress: pickupCode,
        phoneNumber: firstDelivery.phonenumber || "",
        deliveryFrequency: firstDelivery.DeliveryFrequency || "",
        startDate: firstDelivery.DelStartDate || "",
        nextDeliveryDate: firstDelivery.NextDeliveryDate || "",
        endDate: firstDelivery.EndDate || "",
        pharmacyName: firstDelivery.PharmacyName || "",
        cost: totalCost.toString(), // Total cost of all deliveries
        dosageDescription: dosageDescriptions,
        additionalInformation: firstDelivery.AdditionalInformation || "",
        comment: firstDelivery.Comment || "",
        selectedDeliveries: selectedDeliveries, // Pass all deliveries for detailed email
        email: firstDelivery.email,
      };

      const smsMessage = `Your pharmacy pickup code is: ${pickupCode}. You have ${selectedDeliveries.length} medication(s) ready. Please use this code to collect them. Thank you.`;

      const smsPayload = {
        To: firstDelivery.phonenumber,
        Message: smsMessage,
        Source: "Pharmacy Delivery",
        SourceId: user?.User_id || 0,
        TemplateId: 0,
        PolicyNumber: firstDelivery.EnrolleeId || "",
        ReferenceNo: pickupCode,
        UserId: user?.User_id || 0,
      };

      setIsPaymentLoading(true);

      try {
        const entryNumbers = selectedDeliveries.map((d) => String(d.EntryNo));

        await payAutoLine(
          entryNumbers,
          pharmacyId,
          totalCost,
          enrolleeIdFromDelivery,
          1,
        );

        toast.success(
          `Successfully marked ${selectedDeliveries.length} delivery(s) as paid. Total: ₦${totalCost.toFixed(2)}`,
        );

        setSelectedKeys(new Set());
        handleRefresh();

        if (pharmacyId) {
          getProviderPickups(pharmacyId, showAll);
        }

        // Send ONE aggregated notification
        const notificationResults = await Promise.allSettled([
          sendPhaEmailAlert(emailTemplateData),
          sendSms(smsPayload),
        ]);

        const emailResult = notificationResults[0];
        const smsResult = notificationResults[1];

        if (emailResult.status === "rejected") {
          console.error("Email notification failed:", emailResult.reason);
          toast.error("Email notification failed, but payment was successful", {
            duration: 4000,
          });
        }

        if (smsResult.status === "rejected") {
          console.error("SMS notification failed:", smsResult.reason);
          toast.error("SMS notification failed, but payment was successful", {
            duration: 4000,
          });
        }

        if (
          emailResult.status === "fulfilled" &&
          smsResult.status === "fulfilled"
        ) {
          toast.success("Payment successful and notifications sent!", {
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Payment failed:", error);
        toast.error(`Payment failed: ${(error as Error).message}`);
      } finally {
        setIsPaymentLoading(false);
      }
    },
    [pharmacyId, selectedEnrolleeId, showAll, handleRefresh, user?.User_id],
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      deliveryActions.openModal();
    } else {
      deliveryActions.closeModal();
      if (!formState.isEditing) {
        deliveryFormState.reset();
      }
    }
  };

  const handleSubmit = () => {
    deliveryActions.submitAcuteForm(false).then(() => {
      // Refresh details after successful edit
      if (selectedEnrolleeId) {
        toast.loading("Refreshing details...", { id: "refresh-after-edit" });
        getPickupDetails(pharmacyId, selectedEnrolleeId, showAll).then(() => {
          toast.success("Delivery updated and details refreshed!", {
            id: "refresh-after-edit",
          });
        });
      }
    });
  };

  const handleAssignPharmacy = () => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select at least one delivery to assign");

      return;
    }
    setShowAssignModal(true);
  };

  const handleAssignSuccess = () => {
    // Refresh data after successful assignment
    if (selectedEnrolleeId) {
      getPickupDetails(pharmacyId, selectedEnrolleeId, showAll);
    }
    // Also refresh the main pickups list
    if (pharmacyId) {
      getProviderPickups(pharmacyId, showAll);
    }
    // Clear selections
    setSelectedKeys(new Set());
  };

  if (isLoading && !selectedEnrolleeId) {
    return (
      <>
        <PageHeader
          description="View and manage pharmacy pickup requests"
          title="Pending Collections"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner color="primary" size="lg" />
            <p className="mt-4 text-gray-600">Loading pickups...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !providerPickups.length && !selectedEnrolleeId) {
    return (
      <>
        <PageHeader
          description="View and manage pharmacy pickup requests"
          title="Pending Collections"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">⚠️ Error</div>
            <p className="text-gray-600">{error}</p>
            <Button className="mt-4" color="primary" onPress={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        description="View and manage pharmacy pickup requests"
        title="Pending Collections"
      />

      <div>
        {!selectedEnrolleeId ? (
          <>
            {/* Pickups List View */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Switch
                  isSelected={showAll}
                  size="sm"
                  onValueChange={setShowAll}
                >
                  <span className="text-sm font-medium text-gray-700">
                    Show Previous Pickups
                  </span>
                </Switch>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  className="max-w-xs"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-10",
                  }}
                  placeholder="Search by Enrollee ID..."
                  size="sm"
                  value={searchEnrolleeId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  onValueChange={setSearchEnrolleeId}
                />
                <Button
                  color="primary"
                  isDisabled={!searchEnrolleeId.trim()}
                  size="sm"
                  onPress={handleSearch}
                >
                  Search
                </Button>
                {searchEnrolleeId && (
                  <Button
                    color="default"
                    size="sm"
                    variant="flat"
                    onPress={handleClearSearch}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <ProviderPickupsTable
              currentPage={currentPage}
              pickups={providerPickups}
              onPageChange={setCurrentPage}
              onRowClick={handleRowClick}
            />
          </>
        ) : isLoadingDetails ? (
          <>
            {/* Loading Details */}
            <div className="text-center py-10 flex flex-col items-center gap-2">
              <Spinner color="primary" size="lg" />
              <p className="text-gray-600">Loading pickup details...</p>
            </div>
          </>
        ) : (
          <>
            {/* Details View */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  color="default"
                  variant="flat"
                  onPress={handleBackToList}
                >
                  ← Back to List
                </Button>
                <h2 className="text-xl font-semibold">
                  Pickup Details: {selectedEnrolleeId}
                </h2>
              </div>

              <div className="flex gap-2">
                {user?.surname === "PHARMACY BENEFIT PROGRAMME" &&
                  (selectedKeys as Set<string>).size > 0 && (
                    <Button
                      color="success"
                      isDisabled={isPaymentLoading}
                      isLoading={isPaymentLoading}
                      onPress={() => {
                        const selectedDeliveries = (pickupDetails || []).filter(
                          (d: any) =>
                            (selectedKeys as Set<String>).has(
                              String(d.EntryNo),
                            ),
                        );
                        const totalCost = selectedDeliveries.reduce(
                          (sum: number, delivery: any) => {
                            const cost = parseFloat(
                              delivery.cost ||
                                delivery.ProcedureLines?.[0]?.cost ||
                                "0",
                            );

                            return sum + cost;
                          },
                          0,
                        );

                        handlePaySelected(selectedDeliveries, totalCost);
                      }}
                    >
                      Mark as Pack ({(selectedKeys as Set<String>).size})
                    </Button>
                  )}

                {/* Assign Pharmacy Button */}
                {user?.surname === "PHARMACY BENEFIT PROGRAMME" &&
                  (selectedKeys as Set<string>).size > 0 && (
                    <Button
                      className="text-white"
                      color="warning"
                      isDisabled={
                        (pickupDetails || []).length === 0 ||
                        selectedDeliveries.length === 0
                      }
                      onPress={handleAssignPharmacy}
                    >
                      Reassign Pharmacy
                    </Button>
                  )}

                {/* Download PDF Button */}
                <Button
                  color="primary"
                  isDisabled={(pickupDetails || []).length === 0}
                  startContent={<DownloadIcon />}
                  variant="flat"
                  onPress={handleDownloadExcel}
                >
                  Download Excel
                </Button>
              </div>
            </div>

            {detailsError ? (
              <div className="text-center py-10 text-red-500">
                {detailsError}
                <Button className="mt-4" color="primary" onPress={handleRetry}>
                  Retry
                </Button>
              </div>
            ) : (
              <PayAutoLineTable
                deliveries={pickupDetails || []}
                enableCostEdit={
                  user?.surname === "PHARMACY BENEFIT PROGRAMME" ? true : false
                }
                enableEditActions={
                  user?.surname === "PHARMACY BENEFIT PROGRAMME" ? true : false
                }
                enablePharmacyBenefitSelection={true}
                enableViewDetails={true}
                isSelectable={true}
                selectedKeys={selectedKeys}
                user={user}
                onPaySelected={handlePaySelected}
                onRefresh={handleRefresh}
                onSelectionChange={setSelectedKeys}
              />
            )}
          </>
        )}
      </div>

      {/* Assign Pharmacy Modal */}
      <AssignPharmacyModal
        enrolleeId={selectedEnrolleeId}
        isOpen={showAssignModal}
        selectedDeliveries={selectedDeliveries}
        onClose={() => setShowAssignModal(false)}
        onSuccess={handleAssignSuccess}
      />

      {/* Edit Delivery Modal */}
      <Modal
        backdrop="blur"
        isDismissable={false}
        isOpen={showModal}
        scrollBehavior="inside"
        shouldCloseOnInteractOutside={(element) => {
          return !element.className.includes("heroui-select");
        }}
        size="5xl"
        onOpenChange={handleOpenChange}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {formState.isEditing ? "Edit Delivery" : "Create Delivery"}
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

              {/* Section 2: Provider/Pharmacy Setup */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  2. Provider & Pharmacy Setup
                </h3>
                <ProviderSetup />
              </div>

              {/* Section 3: Diagnosis & Procedures */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  3. Diagnosis & Procedures
                </h3>
                <DiagnosisProcedureStep />
              </div>

              {/* Section 4: Additional Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  4. Additional Information
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
              isLoading={isSubmitting}
              radius="sm"
              onPress={handleSubmit}
            >
              {formState.isEditing ? "Update Delivery" : "Create Delivery"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
