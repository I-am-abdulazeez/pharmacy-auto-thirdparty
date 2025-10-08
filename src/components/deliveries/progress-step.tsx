import { useChunkValue } from "stunk/react";

import { deliveryFormState } from "@/lib/store/delivery-store";

export default function ProgressStep() {
  const formState = useChunkValue(deliveryFormState);

  return (
    <div className="flex mb-8">
      {Array.from({ length: formState.totalSteps }).map((_, index) => (
        <div
          key={index}
          className="flex-1 h-2 mx-1 rounded relative overflow-hidden bg-gray-200"
        >
          <div
            className={`absolute inset-0 h-full rounded transition-all duration-500 ease-in-out ${
              index + 1 <= formState.currentStep
                ? "bg-blue-500 scale-x-100"
                : "scale-x-0"
            }`}
            style={{ transformOrigin: "left" }}
          />
        </div>
      ))}
    </div>
  );
}
