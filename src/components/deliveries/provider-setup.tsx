import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useChunkValue } from "stunk/react";

import ModernSelect from "../ui/modern-select";
import WellaPharmacyAutocomplete from "../wella-pharmacy-autocomplete";

import ProviderAutocomplete from "./provider-select";

import { deliveryFormState, deliveryActions } from "@/lib/store/delivery-store";
import { Provider } from "@/types";
import { WellaHealthPharmacy } from "@/lib/services/wella-health-service";

export default function ProviderSetup() {
  const formState = useChunkValue(deliveryFormState);

  const [, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedWellaPharmacy, setSelectedWellaPharmacy] =
    useState<WellaHealthPharmacy | null>(null);

  const [pharmacyType, setPharmacyType] = useState<string>("");

  const pharmacyTypeOptions = [
    { key: "Internal", label: "Internal Pharmacy" },
    { key: "External", label: "External Pharmacy" },
    { key: "WellaHealth", label: "Wella Health" },
  ];

  useEffect(() => {
    if (formState.pharmacyType) {
      setPharmacyType(formState.pharmacyType);
    }

    if (
      (formState.pharmacyType === "WellaHealth" &&
        formState.wellahealthpharmacyname,
      formState.wellahealthpharmacyid)
    ) {
      // Restore Wella Health pharmacy selection if editing
      setSelectedWellaPharmacy({
        pharmacyCode: formState.pharmacyId.toString(),
        pharmacyName: formState.pharmacyName,
        state: "",
        lga: "",
        area: "",
        address: "",
      });
    } else if (
      formState.pharmacyId &&
      formState.pharmacyName &&
      formState.pharmacyType !== "WellaHealth"
    ) {
      setSelectedProvider({
        Pharmacyid: formState.pharmacyId.toString(),
        PharmacyName: formState.pharmacyName,
      });
    } else {
      setSelectedProvider(null);
      setSelectedWellaPharmacy(null);
    }
  }, [
    formState.pharmacyId,
    formState.pharmacyName,
    formState.pharmacyType,
    formState.wellahealthpharmacyid,
    formState.wellahealthpharmacyname,
  ]);

  const handleProviderSelect = (provider: Provider | null) => {
    if (provider) {
      setSelectedProvider(provider);
      deliveryActions.setProvider(provider, pharmacyType);
    } else {
      setSelectedProvider(null);
    }
  };

  const handleWellaPharmacySelect = (pharmacy: WellaHealthPharmacy | null) => {
    if (pharmacy) {
      setSelectedWellaPharmacy(pharmacy);

      const originalPhramacyId =
        selectedPharmacyType === "WellaHealth" ? 111 : pharmacy.pharmacyCode;

      // Store Wella pharmacy info
      deliveryActions.updateFormField("pharmacyId", originalPhramacyId);
      deliveryActions.updateFormField("pharmacyName", pharmacy.pharmacyName);
      deliveryActions.updateFormField("pharmacyType", "WellaHealth");
      deliveryActions.updateFormField(
        "wellahealthpharmacyid",
        pharmacy.pharmacyCode,
      );
      deliveryActions.updateFormField(
        "wellahealthpharmacyname",
        pharmacy.pharmacyName,
      );
    } else {
      setSelectedWellaPharmacy(null);
    }
  };

  const handleRemoveProvider = () => {
    deliveryActions.removeProvider();

    // Clear Wella Health specific fields
    deliveryActions.updateFormField("wellahealthpharmacyid", null);
    deliveryActions.updateFormField("wellahealthpharmacyname", null);
    deliveryActions.updateFormField("pharmacyType", "");

    setSelectedProvider(null);
    setSelectedWellaPharmacy(null);
    setPharmacyType("");
  };

  const selectedPharmacyType = pharmacyType;
  const hasSelectedPharmacy =
    pharmacyType === "WellaHealth"
      ? !!selectedWellaPharmacy
      : !!formState.pharmacyId;

  return (
    <Card className="shadow-sm">
      <CardBody className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pharmacy</h3>

        <div className="space-y-4">
          <ModernSelect
            isRequired={true}
            label="Pharmacy Type"
            options={pharmacyTypeOptions}
            placeholder="Select Pharmacy Type"
            value={pharmacyType}
            onChange={(value) => {
              setPharmacyType(value);
              deliveryActions.updateFormField("pharmacyType", value);

              // Clear selected provider when switching pharmacy type
              if (hasSelectedPharmacy) {
                handleRemoveProvider();
              }
            }}
          />

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
                        Code: {selectedWellaPharmacy.pharmacyCode}
                      </p>
                      <p className="text-xs text-green-700 font-medium">
                        Wella Health Pharmacy
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
              !formState.pharmacyId ? (
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
