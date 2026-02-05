import { useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { DateValue, parseDate } from "@internationalized/date";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { appChunk } from "@/lib/store/app-store";

export default function DeliveryDetailsStep() {
  const formState = useChunkValue(deliveryFormState);
  const { enrolleeData } = useChunkValue(appChunk);

  const [frequencyValue, setFrequencyValue] = useState<Set<string>>(
    new Set(formState.deliveryFrequency ? [formState.deliveryFrequency] : []),
  );

  const startDateValue = formState.delStartDate
    ? parseDate(formState.delStartDate.split("T")[0])
    : undefined;

  const memberExpiryDate = enrolleeData?.Member_ExpiryDate
    ? parseDate(enrolleeData.Member_ExpiryDate.split("T")[0])
    : undefined;

  const frequencyOptions = [
    { key: "One-off", label: "Acute" },
    { key: "Routine", label: "Routine Refill" },
  ];

  const isRoutine = formState.deliveryFrequency === "Routine";

  // Set default values in form state if they don't exist
  useEffect(() => {
    // Sync local state with form state
    if (formState.deliveryFrequency) {
      setFrequencyValue(new Set([formState.deliveryFrequency]));
    }

    if (!formState.delStartDate) {
      const today = new Date().toISOString();

      deliveryActions.updateFormField("delStartDate", today);
    }

    // Auto-set fields based on delivery type
    if (formState.deliveryFrequency === "Routine") {
      // Set frequency duration to 50
      deliveryActions.updateFormField("frequencyDuration", "50");

      // Set end date to 01/01/2050
      const endDate = parseDate("2050-01-01");

      deliveryActions.updateFormField("endDate", endDate.toString());

      // Calculate next delivery date if start date exists
      if (formState.delStartDate) {
        const startDate = parseDate(formState.delStartDate.split("T")[0]);
        const nextDate = startDate.add({ months: 1 });

        deliveryActions.updateFormField(
          "nextDeliveryDate",
          nextDate.toString(),
        );
      }
    } else if (formState.deliveryFrequency === "One-off") {
      // For one-off: end date and next delivery date = start date
      deliveryActions.updateFormField("frequencyDuration", "");

      if (formState.delStartDate) {
        const startDate = parseDate(formState.delStartDate.split("T")[0]);

        deliveryActions.updateFormField(
          "nextDeliveryDate",
          startDate.toString(),
        );
        deliveryActions.updateFormField("endDate", startDate.toString());
      }
    }
  }, [formState.deliveryFrequency, formState.delStartDate]);

  const handleStartDateChange = (date: DateValue | null) => {
    if (!date) return;

    deliveryActions.updateFormField("delStartDate", date.toString());

    // Handle next delivery date and end date based on delivery type
    if (isRoutine) {
      // For routine, next delivery is start date + 1 month
      const nextDate = date.add({ months: 1 });

      deliveryActions.updateFormField("nextDeliveryDate", nextDate.toString());

      // End date remains 2050-01-01 for routine
      const endDate = parseDate("2050-01-01");

      deliveryActions.updateFormField("endDate", endDate.toString());
    } else {
      // For one-off, both next delivery and end date are the same as start date
      deliveryActions.updateFormField("nextDeliveryDate", date.toString());
      deliveryActions.updateFormField("endDate", date.toString());
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    // This won't be called since the select is disabled, but keeping for safety
    setFrequencyValue(selection as Set<string>);
    const frequency = Array.from(selection as Set<string>)[0];

    if (frequency) {
      deliveryActions.updateFormField("deliveryFrequency", frequency);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Delivery Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <Select
          isDisabled
          description="Medication type was selected in the previous step"
          label="Delivery Type"
          selectedKeys={frequencyValue}
          onSelectionChange={handleSelectionChange}
        >
          {frequencyOptions.map((option) => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>

        <DatePicker
          isRequired
          label={"Start Date of Medication"}
          maxValue={memberExpiryDate}
          value={startDateValue}
          onChange={handleStartDateChange}
        />

        {/* Removed the routine-specific input fields */}
        {/* They are now automatically set when Routine is selected */}
      </div>
    </div>
  );
}
