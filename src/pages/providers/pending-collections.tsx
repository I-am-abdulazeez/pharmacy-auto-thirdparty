import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";

import { getDeliveries } from "@/lib/services/delivery-service";
import { deliveryStore } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import { downloadTableAsPDF } from "@/lib/utils";
import PayAutoLineTable from "@/components/pay-autoline-table";
import PageHeader from "@/components/ui/page-header";
import { DownloadIcon } from "@/components/icons";

export default function PendingCollectionsPage() {
  const { deliveries, isLoading, error } = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);
  const [showAll, setShowAll] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const pharmacyId = user?.provider_id?.toString() || "";

  useEffect(() => {
    if (pharmacyId) {
      getDeliveries("", "", "", pharmacyId, "", showAll);
    }
  }, [showAll, pharmacyId]);

  const handleDownloadPDF = () => {
    downloadTableAsPDF(deliveries, showAll);
  };

  const handleRetry = () => {
    getDeliveries("", "", "", pharmacyId, "", showAll);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner color="primary" />
          <p className="mt-4 text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <Button className="mt-4" color="primary" onPress={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        description="View and manage pharmacy pickup requests"
        title="Pending Collections"
      />

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Switch isSelected={showAll} size="sm" onValueChange={setShowAll}>
              <span className="text-sm font-medium text-gray-700">
                Show Previous Pickups
              </span>
            </Switch>
          </div>

          <Button
            color="primary"
            isDisabled={deliveries.length === 0}
            startContent={<DownloadIcon />}
            variant="flat"
            onPress={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </div>

        <PayAutoLineTable
          deliveries={deliveries}
          isSelectable={false}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
      </div>
    </>
  );
}
