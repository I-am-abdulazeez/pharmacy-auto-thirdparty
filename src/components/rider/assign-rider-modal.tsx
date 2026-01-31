import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import toast from "react-hot-toast";

import {
  fetchRiders,
  assignRiderToDeliveries,
} from "@/lib/services/rider-service";

interface Rider {
  rider_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: string;
  city: string;
  state_province: string;
}

interface ProviderPickup {
  EnrolleeName: string;
  scheme_type: string;
  Pharmacyname: string;
  EnrolleeId: string;
  inputteddate: string;
  paydate: string;
  TimeUsed: string;
  EntryNumbers: string; // JSON string like "[10150,10176,10177]"
}

interface AssignRiderModalProps {
  isOpen: boolean;
  selectedKeys: Set<string>;
  pickups: ProviderPickup[]; // NEW: Pass the actual pickup data
  onClose: () => void;
  onAssignmentComplete: () => void;
}

export default function AssignRiderModal({
  isOpen,
  selectedKeys,
  pickups,
  onClose,
  onAssignmentComplete,
}: AssignRiderModalProps) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedRider, setSelectedRider] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadRiders();
    }
  }, [isOpen]);

  const loadRiders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRiders();
      // Filter only active riders
      const activeRiders = data.filter(
        (rider: Rider) => rider.status === "Active",
      );

      setRiders(activeRiders);
    } catch (error) {
      toast.error("Failed to load riders");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRider) {
      toast.error("Please select a rider");

      return;
    }

    const selectedRiderData = riders.find(
      (r) => r.rider_id.toString() === selectedRider,
    );

    if (!selectedRiderData) {
      toast.error("Invalid rider selection");

      return;
    }

    setIsAssigning(true);

    try {
      // Extract EntryNumbers from selected pickups
      const selectedPickups = pickups.filter((pickup, index) => {
        const key = `${pickup.EnrolleeId}-${index}`;

        return selectedKeys.has(key);
      });

      // Parse EntryNumbers from each selected pickup and flatten into single array
      const entryNos: number[] = [];

      selectedPickups.forEach((pickup) => {
        try {
          // Parse the JSON string like "[10150,10176,10177]"
          const numbers = JSON.parse(pickup.EntryNumbers);

          if (Array.isArray(numbers)) {
            entryNos.push(...numbers);
          }
        } catch (e) {
          throw new Error(
            `Invalid EntryNumbers format for enrollee ${pickup.EnrolleeId}: ${(e as Error).message}`,
          );
        }
      });

      if (entryNos.length === 0) {
        toast.error("No valid entry numbers found in selected deliveries");
        setIsAssigning(false);

        return;
      }

      const riderName = `${selectedRiderData.first_name} ${selectedRiderData.last_name}`;

      const result = await assignRiderToDeliveries(riderName, entryNos);

      if (result.status === 200) {
        toast.success(result.ReturnMessage || "Rider assigned successfully");
        onAssignmentComplete();
        onClose();
        setSelectedRider("");
      } else {
        toast.error(result.ReturnMessage || "Failed to assign rider");
      }
    } catch (error) {
      toast.error("An error occurred while assigning rider");
      throw error;
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    if (!isAssigning) {
      setSelectedRider("");
      onClose();
    }
  };

  return (
    <Modal
      hideCloseButton={isAssigning}
      isDismissable={false}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={handleClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Assign Rider to Deliveries
            </ModalHeader>
            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner color="warning" />
                  <span className="ml-3">Loading riders...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Selected deliveries: <strong>{selectedKeys.size}</strong>
                    </p>
                  </div>

                  <Select
                    classNames={{
                      trigger: "min-h-12",
                    }}
                    isDisabled={isAssigning}
                    label="Select Rider"
                    placeholder="Choose a rider to assign"
                    selectedKeys={selectedRider ? [selectedRider] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];

                      setSelectedRider(selected?.toString() || "");
                    }}
                  >
                    {riders.map((rider) => (
                      <SelectItem
                        key={rider.rider_id.toString()}
                        textValue={`${rider.first_name} ${rider.last_name}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {rider.first_name} {rider.last_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {rider.phone_number} • {rider.city},{" "}
                            {rider.state_province}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>

                  {riders.length === 0 && !isLoading && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No active riders available</p>
                      <Button
                        className="mt-2"
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={loadRiders}
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {selectedRider && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Selected Rider:</strong>{" "}
                        {
                          riders.find(
                            (r) => r.rider_id.toString() === selectedRider,
                          )?.first_name
                        }{" "}
                        {
                          riders.find(
                            (r) => r.rider_id.toString() === selectedRider,
                          )?.last_name
                        }
                      </p>
                    </div>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                isDisabled={isAssigning}
                variant="light"
                onPress={handleClose}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={!selectedRider || isLoading}
                isLoading={isAssigning}
                onPress={handleAssign}
              >
                {isAssigning ? "Assigning..." : "Assign Rider"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
