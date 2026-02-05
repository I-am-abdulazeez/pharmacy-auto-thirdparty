import { useEffect, useRef, useState } from "react";
import { useChunkValue } from "stunk/react";
import { Input } from "@heroui/input";
import toast from "react-hot-toast";
import { Button } from "@heroui/button";

import { deliveryActions, deliveryFormState } from "@/lib/store/delivery-store";
import { formatDate } from "@/lib/utils";

export default function AdditionalInfoStep() {
  const formState = useChunkValue(deliveryFormState);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    // Check file type
    const isValidType =
      file.type === "application/pdf" || file.type.startsWith("image/");

    if (!isValidType) {
      toast.error(
        `${file.name} is not a valid file type. Only PDF and image files are allowed.`,
      );

      return;
    }

    // Check file size
    if (file.size > maxSize) {
      toast.error(`${file.name} is too large. Maximum file size is 5MB.`);

      return;
    }

    setUploadedFile(file);
    toast.success("File uploaded successfully!");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    toast.success("File removed successfully!");
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "application/pdf") {
      return "📄";
    } else if (fileType.startsWith("image/")) {
      return "🖼️";
    }

    return "📎";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Store file in form state for access in other components
  useEffect(() => {
    deliveryActions.updateFormField("attachment", uploadedFile);
  }, [uploadedFile]);

  return (
    <div>
      <Input
        label="Comment"
        placeholder="Enter Comment"
        value={formState.comment}
        onChange={(e) =>
          deliveryActions.updateFormField("comment", e.target.value)
        }
      />

      {formState.deliveryFrequency === "Routine" && (
        <div className="my-6">
          <p className="block text-sm font-medium mb-2">
            Attachment (PDF/Image only)
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              accept=".pdf,image/*"
              className="hidden"
              type="file"
              onChange={handleFileUpload}
            />

            <Button
              className="mb-2"
              variant="bordered"
              onPress={() => fileInputRef.current?.click()}
            >
              📁 Choose File
            </Button>

            <p className="text-sm text-gray-600">
              Upload a PDF document or image (Max 5MB)
            </p>
          </div>

          {/* Display uploaded file */}
          {uploadedFile && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Uploaded File</h4>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getFileIcon(uploadedFile.type)}
                  </span>
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  color="danger"
                  size="sm"
                  variant="light"
                  onPress={removeFile}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      <div className="mt-6">
        <h4 className="font-medium mb-2">Delivery Summary</h4>

        <div className="bg-gray-50 p-4 rounded-md">
          <p>
            <strong>Enrollee:</strong> {formState.enrolleeName}
          </p>
          <p>
            <strong>Scheme:</strong> {formState.scheme_type}
          </p>
          <p>
            <strong>Phone Number:</strong> {formState.phonenumber}
          </p>

          <p>
            <strong>Diagnosis:</strong> {formState.diagnosisLines.length}
          </p>
          <p>
            <strong>Medication:</strong> {formState.procedureLines.length}
          </p>
          <p>
            <strong>Medication Start Date:</strong>{" "}
            {formatDate(formState.delStartDate)}
          </p>
          {formState.deliveryFrequency === "Routine" && (
            <p>
              <strong>Attachment:</strong>{" "}
              {uploadedFile ? `1 file (${uploadedFile.name})` : "None"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
