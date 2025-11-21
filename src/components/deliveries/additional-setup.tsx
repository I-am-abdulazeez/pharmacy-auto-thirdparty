import toast from "react-hot-toast";
import { useState } from "react";
import { Input } from "@heroui/input";
import { useChunkValue } from "stunk/react";
import { Button } from "@heroui/button";

import { UploadIcon } from "../icons";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";

export default function AdditionalInfoStep() {
  const formState = useChunkValue(deliveryFormState);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const maxSize = 2 * 1024 * 1024;

      if (file.size > maxSize) {
        toast.error("File size must be less than 3MB");

        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload only JPG, PNG, or PDF files");

        return;
      }

      setUploadedFile(file);

      deliveryActions.updateFormField("prescriptionFile", file);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    deliveryActions.updateFormField("prescriptionFile", null);

    const fileInput = document.getElementById(
      "prescription-upload"
    ) as HTMLInputElement;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Additional Information</h3>

      <Input
        label="Comment"
        placeholder="Enter Comment"
        value={formState.comment}
        onChange={(e) =>
          deliveryActions.updateFormField("comment", e.target.value)
        }
      />

      {/* File Upload Section */}
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="prescription-upload"
        >
          Attach Prescription (if available)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Accepted formats: JPG, PNG, PDF (Max size: 5MB)
        </p>

        {!uploadedFile ? (
          <div className="relative">
            <input
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              aria-label="Upload prescription file"
              className="hidden"
              id="prescription-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label
              aria-label="Upload prescription file"
              className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
              htmlFor="prescription-upload"
            >
              <div className="text-center">
                <UploadIcon />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload prescription
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {filePreview ? (
                  <img
                    alt="Prescription preview"
                    className="w-16 h-16 object-cover rounded"
                    src={filePreview}
                  />
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        clipRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                aria-label="Remove file"
                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                type="button"
                onPress={handleRemoveFile}
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="mt-6">
        <h4 className="font-medium mb-2">Delivery Summary</h4>

        <div className="bg-gray-50 p-4 rounded-md space-y-2">
          <p className="text-sm">
            <strong>Enrollee:</strong> {formState.enrolleeName}
          </p>
          <p className="text-sm">
            <strong>Scheme:</strong> {formState.scheme_type}
          </p>
          <p className="text-sm">
            <strong>Phone Number:</strong> {formState.phonenumber}
          </p>
          <p className="text-sm">
            <strong>Diagnosis:</strong> {formState.diagnosisLines.length}{" "}
            item(s)
          </p>
          <p className="text-sm">
            <strong>Medication:</strong> {formState.procedureLines.length}{" "}
            item(s)
          </p>
          {uploadedFile && (
            <p className="text-sm">
              <strong>Prescription:</strong> ✓ Attached
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
