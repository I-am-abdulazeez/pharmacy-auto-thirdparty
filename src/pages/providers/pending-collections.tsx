import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";

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

  const handleRefresh = () => {
    if (selectedEnrolleeId) {
      getPickupDetails(pharmacyId, selectedEnrolleeId, showAll);
    }
  };

  const handleBackToList = () => {
    setSelectedEnrolleeId(null);
    deliveryStore.set((state) => ({
      ...state,
      pickupDetails: [],
      detailsError: null,
    }));
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
                isSelectable={false}
                selectedKeys={selectedKeys}
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
