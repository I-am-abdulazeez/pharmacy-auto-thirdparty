import { useEffect, useState, useCallback } from "react";
import { useAsyncChunk, useChunk } from "stunk/react";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";

import { State, statesChunk } from "@/lib/store/state-store";
import { appChunk } from "@/lib/store/app-store";

interface SelectStatesProps {
  value?: string;
  onChange?: (stateId: string, stateName: string) => void;
  isRequired?: boolean;
}

export default function SelectStates({
  value,
  onChange,
  isRequired = false,
}: SelectStatesProps = {}) {
  const [appState, setAppState] = useChunk(appChunk);
  const { data, loading, error } = useAsyncChunk(statesChunk);

  const currentValue = value !== undefined ? value : appState.stateId;
  const [selectedState, setSelectedState] = useState<Set<string>>(
    currentValue ? new Set([currentValue]) : new Set(),
  );

  const states = data || [];

  // Sync selected state with prop/global state
  useEffect(() => {
    if (value !== undefined) {
      setSelectedState(value ? new Set([value]) : new Set());
    } else {
      setSelectedState(
        appState.stateId ? new Set([appState.stateId]) : new Set(),
      );
    }
  }, [value, appState.stateId, data]);

  // Set default state if needed (only when not controlled and no onChange)
  useEffect(() => {
    if (
      !currentValue &&
      states.length > 0 &&
      value === undefined &&
      !onChange
    ) {
      const defaultStateId = states[0].Value;

      setSelectedState(new Set([defaultStateId]));
      setAppState((prev) => ({
        ...prev,
        stateId: defaultStateId,
      }));
    }
  }, [states.length, currentValue, setAppState, value, onChange]);

  const handleSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const selectedArray = Array.from(keys as Iterable<string>);
      const newStateId = selectedArray[0] || "";

      const selectedStateObj = states.find(
        (state: State) => state.Value === newStateId,
      );
      const stateName = selectedStateObj ? selectedStateObj.Text : "";

      if (newStateId !== currentValue) {
        setSelectedState(new Set([newStateId]));

        if (onChange) {
          onChange(newStateId, stateName);
        } else {
          setAppState((prev) => ({
            ...prev,
            stateId: newStateId,
            cityId: "",
          }));
        }
      }
    },
    [currentValue, states, onChange, setAppState],
  );

  if (error) {
    return (
      <div>
        <Select
          isDisabled={true}
          isRequired={isRequired}
          label="Select State"
          placeholder="Failed to load states"
          radius="sm"
        >
          <SelectItem key="error">Failed to load states</SelectItem>
        </Select>
        <p className="mt-1 text-sm text-red-500">
          Failed to load states. Please try again.
        </p>
      </div>
    );
  }

  return (
    <Select
      isDisabled={loading}
      isRequired={isRequired}
      items={states}
      label="Select State"
      placeholder={loading ? "Loading states..." : "Select a state"}
      radius="sm"
      selectedKeys={selectedState}
      onSelectionChange={handleSelectionChange}
    >
      {(state: State) => (
        <SelectItem key={state.Value}>{state.Text}</SelectItem>
      )}
    </Select>
  );
}
