import type { Provider } from "@/types";

import { useState, useEffect } from "react";
import { useChunkValue } from "stunk/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import toast from "react-hot-toast";

import ProviderAutocomplete from "../deliveries/provider-select";
import WellaPharmacyAutocomplete from "../wella-pharmacy-autocomplete";

import { assignMultiplePharmacies } from "@/lib/services/assign-service";
import { authStore } from "@/lib/store/app-store";
import { sendSms } from "@/lib/services/sms-service";
import { sendEmailAlert } from "@/lib/services/mail-service";
import {
  callWellaHealthFulfillmentAPI,
  WellaHealthPharmacy,
} from "@/lib/services/wella-health-service";
import { generateRandomCode } from "@/lib/utils";

interface AssignPharmacyModalProps {
  selectedDeliveries: any[];
  isOpen: boolean;
  onClose: () => void;
  enrolleeId: string | null;
  onSuccess?: () => void;
}

export default function AssignPharmacyModal({
  selectedDeliveries,
  isOpen,
  onClose,
  enrolleeId,
  onSuccess,
}: AssignPharmacyModalProps) {
  const { user } = useChunkValue(authStore);

  const [pharmacyType, setPharmacyType] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [selectedWellaPharmacy, setSelectedWellaPharmacy] =
    useState<WellaHealthPharmacy | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const pharmacyTypeOptions = [
    { key: "Internal", label: "Internal Pharmacy" },
    { key: "External", label: "External Pharmacy" },
    { key: "WellaHealth", label: "Wella Health" },
  ];

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setPharmacyType(new Set());
      setSelectedProvider(null);
      setSelectedWellaPharmacy(null);
    }
  }, [isOpen]);

  const handlePharmacyTypeChange = (selection: SharedSelection) => {
    const newPharmacyType = selection as Set<string>;

    setPharmacyType(newPharmacyType);

    // Clear selected provider/pharmacy when switching pharmacy type
    setSelectedProvider(null);
    setSelectedWellaPharmacy(null);
  };

  const handleProviderSelect = (provider: Provider | null) => {
    setSelectedProvider(provider);
  };

  const handleWellaPharmacySelect = (pharmacy: WellaHealthPharmacy | null) => {
    setSelectedWellaPharmacy(pharmacy);
  };

  const handleRemoveProvider = () => {
    setSelectedProvider(null);
    setSelectedWellaPharmacy(null);
  };

  const handleSubmit = async () => {
    const selectedPharmacyType = Array.from(pharmacyType)[0];

    if (selectedPharmacyType === "WellaHealth") {
      if (!selectedWellaPharmacy || !enrolleeId) {
        toast.error("Please select a Wella Health pharmacy");

        return;
      }
    } else {
      if (!selectedProvider || !enrolleeId) {
        toast.error("Please select a pharmacy");

        return;
      }
    }

    // Validate that all selected deliveries have a valid cost
    const deliveriesWithoutCost = selectedDeliveries.filter(
      (delivery) =>
        !delivery.cost || delivery.cost === 0 || delivery.cost === "N/A",
    );

    if (deliveriesWithoutCost.length > 0) {
      const enrolleeNames = deliveriesWithoutCost
        .map((d) => d.EnrolleeName)
        .filter((name, index, self) => self.indexOf(name) === index)
        .join(", ");

      toast.error(
        `Cannot assign pharmacy. Please update the cost for the following medication(s): ${enrolleeNames}. Cost must be greater than 0.`,
        { duration: 9000, style: { maxWidth: "500px" } },
      );

      return;
    }

    setIsAssigning(true);

    try {
      const pickupCode = generateRandomCode();

      // If Wella Health, call their API first
      if (selectedPharmacyType === "WellaHealth" && selectedWellaPharmacy) {
        const loadingToast = toast.loading(
          "Sending fulfillment request to Wella Health...",
        );

        try {
          await callWellaHealthFulfillmentAPI({
            enrolleeData: selectedDeliveries[0], // Use first delivery for enrollee data
            selectedDeliveries: selectedDeliveries,
            pharmacyCode: selectedWellaPharmacy.pharmacyCode,
          });
          toast.dismiss(loadingToast);
          toast.success("Wella Health fulfillment request sent successfully!");
        } catch (wellaError) {
          toast.dismiss(loadingToast);
          toast.error(
            wellaError instanceof Error
              ? `Wella Health API Error: ${wellaError.message}`
              : "Failed to send fulfillment request to Wella Health",
          );

          return; // Stop if Wella Health API fails
        }
      }

      // Build assignment payloads
      const pharmacyId =
        selectedPharmacyType === "WellaHealth"
          ? selectedWellaPharmacy!.pharmacyCode
          : selectedProvider!.Pharmacyid;
      const pharmacyName =
        selectedPharmacyType === "WellaHealth"
          ? selectedWellaPharmacy!.pharmacyName
          : selectedProvider!.PharmacyName;

      const assignmentPayloads = selectedDeliveries.map((delivery) => ({
        enrolleeid: enrolleeId,
        codetopharmacy: pickupCode,
        pharmacyid: selectedPharmacyType === "WellaHealth" ? 111 : pharmacyId,
        assignedby: user?.UserName || "System",
        assignedon: new Date().toISOString(),
        entryno: delivery.EntryNo,
        wellapharmacyname: selectedWellaPharmacy?.pharmacyName,
        wellapharmacyid: selectedWellaPharmacy?.pharmacyCode,
      }));

      // Send one batch request
      await assignMultiplePharmacies(assignmentPayloads);

      // Send notifications ONLY for Internal and External (NOT Wella Health)
      if (selectedPharmacyType !== "WellaHealth") {
        const notificationPromises = selectedDeliveries.map(
          async (delivery) => {
            // SMS - Different message based on pharmacy type
            if (delivery.phonenumber) {
              try {
                let smsMessage = "";

                if (selectedPharmacyType === "Internal") {
                  smsMessage = `Your meds are on the way! Show this OTP to rider: ${pickupCode}. Delivery arriving soon. Questions? Call us on 0901549185. Leadway HMO.`;
                } else if (selectedPharmacyType === "External") {
                  const pharmacyAddress =
                    selectedProvider?.PharmacyAddress || "";
                  const pharmacyTown = selectedProvider?.PharmacyTown || "";

                  smsMessage = `Your meds is ready for pickup at ${pharmacyName}, ${pharmacyAddress}, ${pharmacyTown}. Pickup Code: ${pickupCode}. Present this code & your Leadway ID to collect your Meds.`;
                }

                const smsPayload = {
                  To: delivery.phonenumber,
                  Message: smsMessage,
                  Source: "Pharmacy Assignment",
                  SourceId: user?.User_id || 0,
                  TemplateId: 0,
                  PolicyNumber: delivery.EnrolleeId,
                  ReferenceNo: pickupCode,
                  UserId: user?.User_id || 0,
                };

                await sendSms(smsPayload);
              } catch (smsError) {
                toast.error(
                  smsError instanceof Error
                    ? smsError.message
                    : `Failed to send SMS to ${delivery.EnrolleeName}`,
                );
              }
            }

            // Email - Different template based on pharmacy type
            if (delivery.email || delivery.EnrolleeEmail) {
              try {
                const emailTemplateData = {
                  procedureName: selectedDeliveries.map(
                    (d) => d.ProcedureLines?.[0]?.ProcedureName || "N/A",
                  ),
                  diagnosisName: selectedDeliveries.map(
                    (d) => d.DiagnosisLines?.[0]?.DiagnosisName || "N/A",
                  ),
                  enrolleeName: delivery.EnrolleeName || "",
                  enrolleeId: delivery.EnrolleeId,
                  deliveryAddress: pickupCode,
                  phoneNumber: delivery.phonenumber || "",
                  pharmacyType: selectedPharmacyType,
                  pharmacyName: pharmacyName,
                  pharmacyAddress: selectedProvider?.PharmacyAddress || "",
                  pharmacyTown: selectedProvider?.PharmacyTown || "",
                  selectedDeliveries: selectedDeliveries,
                };

                await sendEmailAlert(emailTemplateData, null);
              } catch (emailError) {
                toast.error(
                  emailError instanceof Error
                    ? emailError.message
                    : `Failed to send email to ${delivery.EnrolleeName}`,
                );
              }
            }
          },
        );

        // Wait for all notifications
        await Promise.all(notificationPromises);
      }

      // Call success callback
      onSuccess?.();
      onClose();

      toast.success(
        selectedPharmacyType === "WellaHealth"
          ? "Wella Health fulfillment completed successfully!"
          : "Pharmacy assigned and notifications sent to all successfully!",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign pharmacy",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedPharmacyType = Array.from(pharmacyType)[0];

  return (
    <Modal
      backdrop="blur"
      isDismissable={false}
      isOpen={isOpen}
      shouldCloseOnInteractOutside={(element) => {
        return !element.className.includes("heroui-select");
      }}
      size="2xl"
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <ModalContent>
        <ModalHeader>Assign Pharmacy</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Select a pharmacy to assign for enrollee:{" "}
                <strong>{enrolleeId}</strong>
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="text-blue-600 font-medium">
                  Selected: <strong>{selectedDeliveries.length}</strong>{" "}
                  {selectedDeliveries.length === 1 ? "delivery" : "deliveries"}
                </span>
              </div>
            </div>

            {selectedDeliveries.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Selected Deliveries:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedDeliveries.map((delivery, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-blue-800 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      {delivery.ProcedureLines?.[0]?.ProcedureName ||
                        "N/A"} -{" "}
                      {delivery.DiagnosisLines?.[0]?.DiagnosisName || "N/A"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Select
              isRequired
              label="Pharmacy Type"
              selectedKeys={pharmacyType}
              onSelectionChange={handlePharmacyTypeChange}
            >
              {pharmacyTypeOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            {selectedPharmacyType && (
              <>
                {selectedPharmacyType === "WellaHealth" ? (
                  // Wella Health pharmacy selection
                  !selectedWellaPharmacy ? (
                    <div>
                      <WellaPharmacyAutocomplete
                        selectedPharmacy={null}
                        onSelect={handleWellaPharmacySelect}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-md border border-green-200">
                      <div>
                        <p className="font-medium text-green-800">
                          {selectedWellaPharmacy.pharmacyName}
                        </p>
                        <p className="text-sm text-green-600">
                          {selectedWellaPharmacy.area},{" "}
                          {selectedWellaPharmacy.state}
                        </p>
                        <p className="text-xs text-green-700">
                          Code: {selectedWellaPharmacy.pharmacyCode}
                        </p>
                      </div>
                      <Button
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={handleRemoveProvider}
                      >
                        Remove
                      </Button>
                    </div>
                  )
                ) : // Internal/External pharmacy selection
                !selectedProvider ? (
                  <div>
                    <ProviderAutocomplete
                      enrolleeId={enrolleeId || ""}
                      isDisabled={false}
                      pharmacyType={selectedPharmacyType}
                      selectedProvider={null}
                      onSelect={handleProviderSelect}
                    />
                    <p className="text-gray-500 text-sm mt-2">
                      Select a pharmacy from the list above
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-800">
                        {selectedProvider.PharmacyName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {selectedProvider.Pharmacyid}
                      </p>
                      <p className="text-xs text-blue-600">
                        {selectedPharmacyType} Pharmacy
                      </p>
                    </div>
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={handleRemoveProvider}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </>
            )}

            {!selectedPharmacyType && (
              <p className="text-gray-500 text-sm text-center py-4">
                Please select a pharmacy type to continue
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isDisabled={
              (selectedPharmacyType === "WellaHealth"
                ? !selectedWellaPharmacy
                : !selectedProvider) ||
              isAssigning ||
              selectedDeliveries.length === 0
            }
            isLoading={isAssigning}
            onPress={handleSubmit}
          >
            {isAssigning
              ? "Assigning..."
              : `Assign ${selectedDeliveries.length} Delivery(s)`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
