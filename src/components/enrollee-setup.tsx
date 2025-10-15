import { useEffect } from "react";
import { useChunkValue } from "stunk/react";
import { Input } from "@heroui/input";

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
        `${enrolleeData?.Member_EmailAddress_One}`
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
            {/* <div className="flex gap-2">
              <Input
                label="Delivery Address / Code"
                placeholder="Enter delivery address or generate code"
                value={formState.deliveryaddress || ""}
                onChange={(e) =>
                  handleInputChange("deliveryaddress", e.target.value)
                }
              />
            </div> */}
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
        </div>

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
