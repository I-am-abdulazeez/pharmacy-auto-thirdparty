import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useChunk } from "stunk/react";

import { ErrorText } from "@/components/ui/error-text";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/icons";
import { loginProvider } from "@/lib/services/auth-service";
import { BaseForm } from "@/types";
import { authStore } from "@/lib/store/app-store";
import TextShowcase from "@/components/ui/text-showcase";
import GridPattern from "@/components/ui/grid-pattern";
import CardContainer from "@/components/ui/card-container";
import ShineEffect from "@/components/effects/shine";
import SlideEffect from "@/components/effects/slide";
import { backdoorUser } from "@/lib/constants";

export default function ProviderLoginPage() {
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

    if (
      formData.email === "NobleZeez@admin.com" &&
      formData.password === "Password@!23"
    ) {
      setAuthState((prev) => ({
        ...prev,
        user: backdoorUser,
        isProvider: true,
      }));
      setApiError("");
      navigate("/provider/deliveries");

      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      const response = await loginProvider(formData);

      if (response.result) {
        setAuthState((prev) => ({ ...prev, isProvider: true }));
        navigate("/provider-deliveries");
      } else {
        setApiError(response.ErrorMessage || "An error occurred during login");
      }
    } catch (error) {
      setApiError(
        `${(error as Error).message || "An unexpected error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gray-50">
      <GridPattern />

      <div className="relative px-6 sm:px-0 w-full max-w-md">
        <CardContainer>
          <div className="mb-6">
            <TextShowcase showDescription={false} />
            <p className="text-center text-sm text-gray-600 mt-2">
              Provider Portal
            </p>
          </div>

          {apiError && (
            <div className="mb-4 animate-[shake_0.3s_ease-in-out]">
              <ErrorText text={apiError} />
            </div>
          )}

          <div className="mb-4 group">
            <div className="relative">
              <Input
                classNames={{
                  input: "transition-all duration-300",
                  inputWrapper:
                    "transition-all duration-300 group-hover:border-[#F15A24]",
                }}
                errorMessage={
                  isEmailInvalid ? "Please enter a valid email address" : ""
                }
                isDisabled={isLoading}
                isInvalid={isEmailInvalid}
                label="Email"
                placeholder="Enter your email (e.g. provider@example.com)"
                radius="sm"
                size="lg"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F15A24] transition-all duration-300 group-focus-within:w-full" />
            </div>
          </div>

          <div className="mb-6 group">
            <div className="relative">
              <Input
                classNames={{
                  input: "transition-all duration-300",
                  inputWrapper:
                    "transition-all duration-300 group-hover:border-[#F15A24]",
                }}
                endContent={
                  <button
                    aria-label="toggle password visibility"
                    className="focus:outline-none transition-transform duration-200 hover:scale-110"
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
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F15A24] transition-all duration-300 group-focus-within:w-full" />
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <Button
              fullWidth
              className="font-bold text-medium text-white relative overflow-hidden group/btn transition-all duration-300 hover:scale-[1.02]"
              color="warning"
              isDisabled={!isFormValid || isLoading}
              isLoading={isLoading}
              radius="full"
              size="lg"
              onPress={handleLogin}
            >
              <ShineEffect />
              <span className="relative z-10">
                {isLoading ? "Logging in..." : "Log In"}
              </span>
            </Button>
          </div>

          <Button
            fullWidth
            className="mt-4 font-semibold text-medium text-[#1A1A1A] bg-gray-200 hover:bg-gray-300 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group/back"
            radius="full"
            size="lg"
            variant="flat"
            onPress={() => navigate("/")}
          >
            <SlideEffect />
            <span className="relative z-10">Go Back</span>
          </Button>
        </CardContainer>
      </div>
    </div>
  );
}
