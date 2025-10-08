import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { useChunkValue } from "stunk/react";

import { deliveryActions, deliveryStore } from "@/lib/store/delivery-store";
import { formatDate } from "@/lib/utils";

export default function DuplicateModal() {
  const { showDuplicateModal, duplicateDeliveries, isSubmitting } =
    useChunkValue(deliveryStore);

  return (
    <Modal
      backdrop="blur"
      isDismissable={false}
      isOpen={showDuplicateModal}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-orange-600">
            ⚠️ Duplicate Delivery Warning
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-700">
              {`We found existing deliveries with similar medications that haven't
              reached their end date yet. Creating a duplicate delivery might
              result in over-medication.`}
            </p>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">
                Existing Deliveries:
              </h4>
              <div className="space-y-2">
                {duplicateDeliveries.map((delivery, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded border border-orange-200"
                  >
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Delivery ID:</strong> {delivery.DeliveryId}
                      </p>
                      <p>
                        <strong>Enrollee:</strong> {delivery.EnrolleeName}
                      </p>
                      <p>
                        <strong>Frequency:</strong> {delivery.DeliveryFrequency}
                      </p>
                      <p>
                        <strong>End Date:</strong>{" "}
                        {formatDate(delivery.EndDate)}
                      </p>
                      <div className="mt-2">
                        <p>
                          <strong>Medications:</strong>
                        </p>
                        <ul className="list-disc list-inside ml-2 text-xs">
                          {delivery.ProcedureLines?.map((procedure, idx) => (
                            <li key={idx}>
                              {procedure.ProcedureName} (Qty:{" "}
                              {procedure.ProcedureQuantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-800 text-sm">
                <strong>⚠️ Warning:</strong> Creating duplicate deliveries may
                lead to:
              </p>
              <ul className="list-disc list-inside text-red-700 text-sm mt-2 ml-4">
                <li>Over-medication of the patient</li>
                <li>Increased costs</li>
                <li>Potential health risks</li>
                <li>Inventory management issues</li>
              </ul>
            </div>

            <p className="text-gray-700 font-medium">
              Do you still want to proceed with creating this delivery?
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button
              color="default"
              variant="light"
              onPress={() => deliveryActions.handleDuplicateConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              className="text-white"
              color="warning"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              onPress={() => deliveryActions.handleDuplicateConfirmation(true)}
            >
              Yes, Create Duplicate
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
