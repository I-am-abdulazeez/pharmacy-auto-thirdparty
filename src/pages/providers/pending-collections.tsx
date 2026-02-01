import { useEffect, useState, useCallback } from "react";
import { useChunkValue } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import toast from "react-hot-toast";

import {
  getProviderPickups,
  getPickupDetails,
} from "@/lib/services/delivery-service";
import { deliveryStore } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import { downloadTableAsPDF } from "@/lib/utils";
import PayAutoLineTable from "@/components/pay-autoline-table";
import PageHeader from "@/components/ui/page-header";
import { DownloadIcon } from "@/components/icons";
import ProviderPickupsTable from "@/components/pickup/provider-pickup-table";
import { payAutoLine } from "@/lib/services/payautoline-services";

export default function PendingCollectionsPage() {
  const {
    providerPickups,
    pickupDetails,
    isLoading,
    isLoadingDetails,
    error,
    detailsError,
  } = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);
  const [showAll, setShowAll] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedEnrolleeId, setSelectedEnrolleeId] = useState<string | null>(
    null,
  );
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const pharmacyId = user?.provider_id?.toString() || "";

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
  };

  const handleDownloadPDF = () => {
    downloadTableAsPDF(pickupDetails || [], showAll);
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

      // Get enrollee ID (should be same for all selected)
      const enrolleeIdFromDelivery =
        selectedDeliveries[0]?.EnrolleeId || selectedEnrolleeId || "";

      if (!enrolleeIdFromDelivery) {
        toast.error("Unable to find enrollee ID for selected deliveries");

        return;
      }

      setIsPaymentLoading(true);
      try {
        const entryNumbers = selectedDeliveries.map((d) => String(d.EntryNo));

        await payAutoLine(
          entryNumbers,
          pharmacyId,
          totalCost,
          enrolleeIdFromDelivery,
        );

        toast.success(
          `Successfully marked ${selectedDeliveries.length} delivery(s) as paid. Total: ₦${totalCost.toFixed(2)}`,
        );
        setSelectedKeys(new Set());

        // Refresh current details view
        handleRefresh();

        // Also refresh the main pickups list in background
        if (pharmacyId) {
          getProviderPickups(pharmacyId, showAll);
        }
      } catch (error) {
        toast.error(`Payment failed: ${(error as Error).message}`);
      } finally {
        setIsPaymentLoading(false);
      }
    },
    [pharmacyId, selectedEnrolleeId, showAll, handleRefresh],
  );

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
            </div>

            <ProviderPickupsTable
              pickups={providerPickups}
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
                  selectedKeys.size > 0 && (
                    <Button
                      color="success"
                      isDisabled={isPaymentLoading}
                      isLoading={isPaymentLoading}
                      onPress={() => {
                        const selectedDeliveries = (pickupDetails || []).filter(
                          (d: any) => selectedKeys.has(String(d.EntryNo)),
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
                      Mark as Pack ({selectedKeys.size})
                    </Button>
                  )}

                <Button
                  color="primary"
                  isDisabled={(pickupDetails || []).length === 0}
                  startContent={<DownloadIcon />}
                  variant="flat"
                  onPress={handleDownloadPDF}
                >
                  Download PDF
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
                enablePharmacyBenefitSelection={true}
                isSelectable={false}
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
    </>
  );
}
