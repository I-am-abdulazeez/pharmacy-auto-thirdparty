import { useChunkValue } from "stunk/react";
import { Input } from "@heroui/input";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";

export default function AdditionalInfoStep() {
  const formState = useChunkValue(deliveryFormState);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Additional Information</h3>

      <Input
        className="mb-4"
        label="Alternative Phone Number"
        placeholder="Enter Alt Phone Number"
        value={formState.additionalInformation}
        onChange={(e) =>
          deliveryActions.updateFormField(
            "additionalInformation",
            e.target.value
          )
        }
      />

      <Input
        label="Comment"
        placeholder="Enter Comment"
        value={formState.comment}
        onChange={(e) =>
          deliveryActions.updateFormField("comment", e.target.value)
        }
      />

      {/* Summary Section */}
      <div className="mt-6">
        <h4 className="font-medium mb-2">Delivery Summary</h4>

        <div className="bg-gray-50 p-4 rounded-md">
          <p>
            <strong>Enrollee:</strong> {formState.enrolleeName}
          </p>
          <p>
            <strong>Scheme:</strong> {formState.schemeName}
          </p>
          {/* <p>
            <strong>Address:</strong> {formState.deliveryaddress}
          </p> */}
          <p>
            <strong>Phone Number:</strong> {formState.phonenumber}
          </p>
          <p>
            <strong>Frequency:</strong> {formState.deliveryFrequency}
          </p>
          <p>
            <strong>Start Date:</strong> {formState.delStartDate}
          </p>

          <p>
            <strong>Diagnosis:</strong> {formState.diagnosisLines.length}
          </p>
          <p>
            <strong>Medication:</strong> {formState.procedureLines.length}
          </p>
          {/* <p>
            <strong>Cost:</strong> {calculateTotalCost()}
          </p> */}
        </div>
      </div>
    </div>
  );
}
