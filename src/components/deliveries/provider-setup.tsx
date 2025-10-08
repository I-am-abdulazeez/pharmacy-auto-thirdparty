import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useChunkValue } from "stunk/react";

import ProviderAutocomplete from "./provider-select";

import { deliveryFormState, deliveryActions } from "@/lib/store/delivery-store";
import { Provider } from "@/types";

export default function ProviderSetup() {
  const formState = useChunkValue(deliveryFormState);

  const [, setSelectedProvider] = useState<Provider | null>(null);

  // Local pharmacy type state - not stored globally
  const [pharmacyType, setPharmacyType] = useState<Set<string>>(new Set());

  const pharmacyTypeOptions = [
    { key: "Internal", label: "Internal Pharmacy" },
    { key: "External", label: "External Pharmacy" },
  ];

  useEffect(() => {
    if (formState.pharmacyId && formState.pharmacyName) {
      setSelectedProvider({
        Pharmacyid: formState.pharmacyId,
        PharmacyName: formState.pharmacyName,
      });
    } else {
      setSelectedProvider(null);
    }
  }, [formState.pharmacyId, formState.pharmacyName]);

  const handleProviderSelect = (provider: Provider | null) => {
    if (provider) {
      setSelectedProvider(provider);
      // Automatically add the provider to the form state
      deliveryActions.setProvider(provider);
    } else {
      setSelectedProvider(null);
    }
  };

  const handleRemoveProvider = () => {
    deliveryActions.removeProvider();
    setSelectedProvider(null);
  };

  const handlePharmacyTypeChange = (selection: SharedSelection) => {
    const newPharmacyType = selection as Set<string>;

    setPharmacyType(newPharmacyType);

    // Clear selected provider when switching pharmacy type
    if (formState.pharmacyId) {
      handleRemoveProvider();
    }
  };

  const selectedPharmacyType = Array.from(pharmacyType)[0];

  return (
    <Card className="shadow-sm">
      <CardBody className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pharmacy</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {selectedPharmacyType && (
            <>
              {!formState.pharmacyId ? (
                <div>
                  <ProviderAutocomplete
                    enrolleeId={formState.enrolleeId}
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
                      {formState.pharmacyName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {formState.pharmacyId}
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
      </CardBody>
    </Card>
  );
}
