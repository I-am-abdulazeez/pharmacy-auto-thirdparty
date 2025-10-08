import type { Diagnosis, Procedure } from "@/types";

import { useState, useEffect } from "react";
import { useChunkValue } from "stunk/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { toast } from "react-hot-toast";

import { SearchIcon } from "../icons";

import DiagnosisAutocomplete from "./diagnosis-select";
import { useProcedureSearch } from "./procedure-select";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";

export default function DiagnosisProcedureStep() {
  const formState = useChunkValue(deliveryFormState);
  const [isOpen, setIsOpen] = useState(false);
  const [, setSelectedDiagnosis] = useState<Diagnosis | null>(null);

  const [originalCosts, setOriginalCosts] = useState<Map<string, string>>(
    new Map()
  );

  // Procedure search states
  const [inputValue, setInputValue] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<Set<string>>(
    new Set()
  );
  const [selectedProcedureObj, setSelectedProcedureObj] =
    useState<Procedure | null>(null);

  const { items, hasMore, isLoading, onLoadMore, handleSearch, hasSearched } =
    useProcedureSearch({
      fetchDelay: 300,
    });

  // Auto-open select when search results are available
  useEffect(() => {
    if (hasSearched && items.length > 0 && !isLoading) {
      // Small delay to ensure the Select component is rendered
      setTimeout(() => {
        setIsOpen(true);
      }, 100);
    }
  }, [hasSearched, items.length, isLoading]);

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: items.length > 0,
    shouldUseLoader: false,
    onLoadMore,
  });

  const handleDiagnosisSelect = (diagnosis: Diagnosis | null) => {
    if (diagnosis) {
      // Clear any existing diagnosis first, then add the new one
      if (formState.diagnosisLines.length > 0) {
        deliveryActions.removeDiagnosis(
          formState.diagnosisLines[0].DiagnosisId
        );
      }
      deliveryActions.addDiagnosis(diagnosis);
      setSelectedDiagnosis(null);
    } else {
      setSelectedDiagnosis(diagnosis);
    }
  };

  const handleAddProcedure = () => {
    if (selectedProcedureObj) {
      // Store the original cost from the selected procedure
      setOriginalCosts((prev) =>
        new Map(prev).set(
          selectedProcedureObj.ProcedureId,
          selectedProcedureObj.cost || "0"
        )
      );

      // Add procedure with cost set to empty string to indicate it's unmodified
      const procedureToAdd = {
        ...selectedProcedureObj,
        cost: "", // Empty string indicates unmodified cost
        dosageDescription: "", // Initialize with empty dosage description
      };

      deliveryActions.addProcedure(procedureToAdd);
      setSelectedProcedureObj(null);
      setSelectedProcedure(new Set());
      setIsOpen(false); // Close the select after adding
    }
  };

  const handleQuantityChange = (procedureId: string, newQuantity: number) => {
    // Only update the quantity, don't touch the cost
    deliveryActions.updateProcedureQuantity(procedureId, newQuantity);
  };

  const handleSearchClick = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a search term");

      return;
    }
    handleSearch(inputValue);
    setSelectedProcedure(new Set()); // Clear selection when searching
    setSelectedProcedureObj(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const handleDosageChange = (
    procedureId: string,
    dosageDescription: string
  ) => {
    deliveryActions.updateProcedureDosage(procedureId, dosageDescription);
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setSelectedProcedure(selection as Set<string>);

    // Find the selected procedure object
    const selectedKey = Array.from(selection as Set<string>)[0];

    if (selectedKey) {
      const selected = items.find(
        (item) => `${item.ProcedureId}-${item.ProcedureName}` === selectedKey
      );

      setSelectedProcedureObj(selected || null);
    } else {
      setSelectedProcedureObj(null);
    }
  };

  const getUnitCost = (procedure: any) => {
    if (
      procedure.cost === "" ||
      procedure.cost === null ||
      procedure.cost === undefined
    ) {
      // Show original unit cost if current cost is empty (unmodified)
      return originalCosts.get(procedure.ProcedureId) || "0";
    }
    // If cost has been modified, treat it as unit cost

    return procedure.cost;
  };

  // Helper function to get total cost for display
  const getTotalCost = (procedure: any) => {
    const unitCost = getUnitCost(procedure);

    return Math.round(parseFloat(unitCost) * procedure.ProcedureQuantity);
  };

  // Handle unit cost change
  const handleUnitCostChange = (procedureId: string, newUnitCost: string) => {
    const originalCost = originalCosts.get(procedureId) || "0";

    // If the new value equals original cost, store empty string to indicate unmodified
    // Otherwise, store the actual new value
    const costToSave = newUnitCost === originalCost ? "" : newUnitCost;

    deliveryActions.updateProcedureCost(procedureId, costToSave);
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis Section */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Diagnosis
          </h3>

          <div className="space-y-4">
            {formState.diagnosisLines.length === 0 ? (
              <div>
                <DiagnosisAutocomplete
                  isDisabled={false}
                  onSelect={handleDiagnosisSelect}
                />
                <p className="text-gray-500 text-sm mt-2">
                  Select a diagnosis from the list above
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800">
                      {formState.diagnosisLines[0].DiagnosisName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {formState.diagnosisLines[0].DiagnosisId}
                    </p>
                  </div>
                  <Button
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() =>
                      deliveryActions.removeDiagnosis(
                        formState.diagnosisLines[0].DiagnosisId
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>

                <div>
                  <DiagnosisAutocomplete
                    isDisabled={false}
                    onSelect={handleDiagnosisSelect}
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    Select a different diagnosis to replace the current one
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Procedures Section */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Medication
          </h3>

          <div className="space-y-4">
            {/* Search and Select Row */}
            <div className="grid grid-cols-1 md:grid-cols-20 gap-4">
              {/* Left side - Search Input (35%) */}
              <div className="md:col-span-7 space-y-3">
                <Input
                  label="Search Procedures"
                  placeholder="Enter procedure name to search..."
                  startContent={
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyUp={handleKeyPress}
                />
                <Button
                  className="w-full"
                  color="primary"
                  isLoading={isLoading}
                  onPress={handleSearchClick}
                >
                  Search
                </Button>
              </div>

              {/* Right side - Select Dropdown (65%) */}
              <div className="md:col-span-13 space-y-3">
                {hasSearched && items.length > 0 ? (
                  <Select
                    isOpen={isOpen}
                    label="Select Procedure"
                    placeholder="Choose from search results..."
                    scrollRef={scrollerRef}
                    selectedKeys={selectedProcedure}
                    onOpenChange={setIsOpen}
                    onSelectionChange={handleSelectionChange}
                  >
                    {items.map((item: Procedure) => (
                      <SelectItem
                        key={`${item.ProcedureId}-${item.ProcedureName}`}
                      >
                        {item.ProcedureName}
                      </SelectItem>
                    ))}
                  </Select>
                ) : (
                  <div className="h-14 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      {hasSearched
                        ? "No results found"
                        : "Search to see options"}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  color="primary"
                  isDisabled={!selectedProcedureObj}
                  onPress={handleAddProcedure}
                >
                  Add Medication
                </Button>
              </div>
            </div>

            {/* Loading more indicator */}
            {isLoading && items.length > 0 && (
              <div className="text-center py-2 text-sm text-gray-500">
                Loading more results...
              </div>
            )}

            {/* Search state messages */}
            {hasSearched && items.length === 0 && !isLoading && (
              <div className="text-center py-4 text-gray-500">
                <p>{`No procedures found for "${inputValue}"`}</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}

            {!hasSearched && !isLoading && (
              <div className="text-center py-4 text-gray-500">
                <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {`Enter a search term and click "Search" to find procedures`}
                </p>
              </div>
            )}

            {/* Added Procedures List */}
            {formState.procedureLines.length === 0 ? (
              <p className="text-gray-500 text-sm">No procedures added yet</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-3">
                {formState.procedureLines.map((procedure) => {
                  const unitCost = getUnitCost(procedure);
                  const totalCost = getTotalCost(procedure);

                  return (
                    <div
                      key={procedure.ProcedureId}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                    >
                      {/* Left side - Procedure info */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <p className="font-medium text-gray-900 truncate">
                            {procedure.ProcedureName}
                          </p>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500">
                              ID: {procedure.ProcedureId}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              Total: ₦{totalCost.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Input fields in a row */}
                        <div className="flex gap-3 max-w-xs">
                          <Input
                            className="w-24"
                            label="Unit Cost"
                            placeholder="0"
                            size="sm"
                            type="number"
                            value={unitCost}
                            onChange={(e) =>
                              handleUnitCostChange(
                                procedure.ProcedureId,
                                e.target.value
                              )
                            }
                          />
                          <Input
                            className="w-20"
                            label="Quantity"
                            min="1"
                            placeholder="1"
                            size="sm"
                            type="number"
                            value={procedure.ProcedureQuantity.toString()}
                            onChange={(e) =>
                              handleQuantityChange(
                                procedure.ProcedureId,
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <Input
                          className="w-full mt-3"
                          label="Dosage Description"
                          placeholder="e.g., Take 1 tablet twice daily with food"
                          size="sm"
                          type="text"
                          value={procedure.DosageDescription || ""}
                          onChange={(e) =>
                            handleDosageChange(
                              procedure.ProcedureId,
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {/* Right side - Remove button */}
                      <Button
                        className="ml-4"
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() =>
                          deliveryActions.removeProcedure(procedure.ProcedureId)
                        }
                      >
                        {formState.isEditing ? "Edit" : "Delete"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
