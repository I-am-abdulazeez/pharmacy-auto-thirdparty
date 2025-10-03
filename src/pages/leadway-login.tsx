import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useChunk } from "stunk/react";

import { ErrorText } from "@/components/error-text";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/icons";
import { loginLeadway } from "@/lib/services/login-user";
import { BaseForm } from "@/types";
import { authStore } from "@/lib/store/app-store";
import { backdoorUser } from "@/lib/constants";
import TextShowcase from "@/components/text-showcase";

export default function LeadwayLoginPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [, setAuthState] = useChunk(authStore);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const [formData, setFormData] = useState<BaseForm>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const isFormValid =
    formData.email.trim() !== "" && formData.password.trim() !== "";
  const isEmailInvalid =
    formData.email.trim() !== "" && !/\S+@\S+\.\S+/.test(formData.email);

  const handleLogin = async () => {
    if (!isFormValid) return;

    // Backdoor login check
    if (
      formData.email === "NobleZeez@admin.com" &&
      formData.password === "Password@!23"
    ) {
      setAuthState((prev) => ({ ...prev, user: backdoorUser }));
      setApiError("");
      navigate("/enrollees");

      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const response = await loginLeadway(formData);

      if (response.result) {
        navigate("/enrollees");
      } else {
        setApiError(response.ErrorMessage || "An error occurred during login");
      }
    } catch (error) {
      setApiError(`An unexpected error occurred: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="px-6 sm:px-0 w-full max-w-md">
        <TextShowcase showDescription={false} />

        {apiError && <ErrorText text={apiError} />}
        <div className="mb-4">
          <Input
            errorMessage={
              isEmailInvalid ? "Please enter a valid email address" : ""
            }
            isDisabled={isLoading}
            isInvalid={isEmailInvalid}
            label="Email"
            placeholder="Enter your email (e.g. user@leadway.com)"
            radius="sm"
            size="lg"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div className="mb-4">
          <Input
            endContent={
              <button
                aria-label="toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            isDisabled={isLoading}
            label="Password"
            placeholder="Enter your password"
            radius="sm"
            size="lg"
            type={isVisible ? "text" : "password"}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-4 mt-6 justify-center">
          <Button
            fullWidth
            className="font-bold text-medium text-white bg-red-600"
            isDisabled={!isFormValid || isLoading}
            isLoading={isLoading}
            radius="sm"
            size="lg"
            onPress={handleLogin}
          >
            {isLoading ? "Logging in..." : "Sign in"}
          </Button>
        </div>
        <Button
          fullWidth
          className="mt-4 font-semibold text-medium text-[#1A1A1A] bg-gray-200 hover:bg-gray-300"
          size="lg"
          variant="flat"
          onPress={() => navigate("/")}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
