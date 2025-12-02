import { useEffect } from "react";
import { useChunkValue } from "stunk/react";
import { Input } from "@heroui/input";

import SelectStates from "./select-state";

import { appChunk, authStore } from "@/lib/store/app-store";
import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { generateRandomCode } from "@/lib/utils";

export default function EnrolleeSelectionStep() {
  const formState = useChunkValue(deliveryFormState);
  const { user } = useChunkValue(authStore);
  const {
    searchCriteria: { enrolleeId },
    enrolleeData,
  } = useChunkValue(appChunk);

  useEffect(() => {
    if (user && !formState.isEditing) {
      deliveryActions.updateFormField(
        "enrolleeId",
        enrolleeId || enrolleeData?.Member_EnrolleeID
      );
      deliveryActions.updateFormField(
        "enrolleeName",
        `${enrolleeData?.Member_MemberTitle} ${enrolleeData?.Member_FirstName} ${enrolleeData?.Member_Surname}`
      );
      deliveryActions.updateFormField(
        "enrolleeEmail",
        `${enrolleeData?.Member_EmailAddress_One || formState.enrolleeEmail}`
      );
      deliveryActions.updateFormField(
        "scheme_type",
        enrolleeData?.Plan_Category
      );

      // Auto-generate delivery code if not already set
      if (!formState.deliveryaddress) {
        const generatedCode = generateRandomCode();

        deliveryActions.updateFormField("deliveryaddress", generatedCode);
      }

      if (!formState.phonenumber) {
        deliveryActions.updateFormField(
          "phonenumber",
          enrolleeData?.Member_Phone_One
        );
      }
    } else if (user && formState.isEditing) {
      if (!formState.schemeId) {
        deliveryActions.updateFormField("schemeId", user.insco_id.toString());
      }
    }
  }, [user, formState.isEditing]);

  const handleInputChange = (field: string, value: string) => {
    deliveryActions.updateFormField(field, value);
  };

  const handleStateChange = (stateId: string, stateName: string) => {
    deliveryActions.updateFormField("selectedStateId", stateId);
    deliveryActions.updateFormField("selectedStateName", stateName);

    // Check if the selected state is Lagos and update islagos
    const isLagos = stateName.toLowerCase() === "lagos" ? 1 : 0;

    deliveryActions.updateFormField("islagos", isLagos);

    // Get current address without any previous state
    let baseAddress = formState.memberaddress || "";

    // Remove any previously appended state name
    if (formState.selectedStateName) {
      baseAddress = baseAddress
        .replace(`, ${formState.selectedStateName}`, "")
        .trim();
    }

    // Concatenate the new state to the address
    const updatedAddress = baseAddress
      ? `${baseAddress}, ${stateName}`
      : stateName;

    // Update the memberaddress field directly
    deliveryActions.updateFormField("memberaddress", updatedAddress);
  };

  const handleMemberAddressChange = (value: string) => {
    deliveryActions.updateFormField("memberaddress", value);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">
        {formState.isEditing
          ? "Edit Delivery - Enrollee Information"
          : "Enrollee Information"}
      </h3>

      <div className="mt-4 p-5 bg-gray-50 rounded-md">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Enrollee ID</p>
            <p className="font-medium">{formState.enrolleeId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{formState.enrolleeName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Scheme</p>
            <p className="font-medium">{formState.scheme_type}</p>
          </div>
        </div>

        {/* Editable input fields */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Email Address"
              placeholder="Enter Email Address"
              type="email"
              value={formState.enrolleeEmail || ""}
              onChange={(e) =>
                handleInputChange("enrolleeEmail", e.target.value)
              }
            />
          </div>
          <div>
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              type="tel"
              value={formState.phonenumber || ""}
              onChange={(e) => handleInputChange("phonenumber", e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Member Address"
              placeholder="Enter member address (e.g., 12, Euba street, fadeyi)"
              value={formState.memberaddress || ""}
              onChange={(e) => handleMemberAddressChange(e.target.value)}
            />
          </div>
          <div>
            <SelectStates
              isRequired={true}
              value={formState.selectedStateId || ""}
              onChange={handleStateChange}
            />
          </div>
        </div>

        {/* Display Lagos delivery status if state is selected */}
        {formState.selectedStateName && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">
              Selected State:{" "}
              <span className="font-medium">{formState.selectedStateName}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Lagos Delivery:{" "}
              <span className="font-semibold">
                {formState.islagos === 1 ? "Yes ✓" : "No"}
              </span>
            </p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p>
            {formState.isEditing
              ? "Editing delivery information for the above enrollee"
              : "This delivery will be created for the displayed enrollee"}
          </p>
        </div>
      </div>
    </div>
  );
}
