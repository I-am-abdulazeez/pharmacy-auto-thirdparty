import { useEffect, useState } from "react";
import { useChunk } from "stunk/react";

import { appChunk } from "@/lib/store/app-store";

type SearchCriteria = {
  enrolleeId: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
};

type FieldValidation = {
  isInvalid: boolean;
  errorMessage: string;
};

type ValidationState = {
  [K in keyof SearchCriteria]: FieldValidation;
};

export function useEnrolleeSearch() {
  const [, setState] = useChunk(appChunk);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    enrolleeId: "",
    firstName: "",
    lastName: "",
    mobileNo: "",
    email: ""
  });

  const [validation, setValidation] = useState<ValidationState>({
    enrolleeId: { isInvalid: false, errorMessage: "" },
    firstName: { isInvalid: false, errorMessage: "" },
    lastName: { isInvalid: false, errorMessage: "" },
    mobileNo: { isInvalid: false, errorMessage: "" },
    email: { isInvalid: false, errorMessage: "" }
  });

  const validateField = (name: keyof SearchCriteria, value: string): FieldValidation => {
    switch (name) {
      case 'enrolleeId':
        if (value.trim() && !/^\d+\/\d+$/.test(value.trim())) {
          return {
            isInvalid: true,
            errorMessage: "ID must be a number followed by / and another number (e.g. 21000645/1)"
          };
        }
        break;

      case 'email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return {
            isInvalid: true,
            errorMessage: "Please enter a valid email address"
          };
        }
        break;

      case 'mobileNo':
        if (value.trim() && !/^\+?[\d\s-()]+$/.test(value.trim())) {
          return {
            isInvalid: true,
            errorMessage: "Please enter a valid mobile number"
          };
        }
        break;

      case 'firstName':
      case 'lastName':
        if (value.trim() && value.trim().length < 2) {
          return {
            isInvalid: true,
            errorMessage: `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`
          };
        }
        break;
    }

    return { isInvalid: false, errorMessage: "" };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SearchCriteria;

    setSearchCriteria(prev => ({
      ...prev,
      [fieldName]: value
    }));

    const fieldValidation = validateField(fieldName, value);

    setValidation(prev => ({
      ...prev,
      [fieldName]: fieldValidation
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SearchCriteria;

    const hasValidValues = Object.values(searchCriteria).some(val => val.trim() !== "");
    const allFieldsValid = Object.values(validation).every(v => !v.isInvalid);

    if (hasValidValues && allFieldsValid) {
      setState((state) => ({
        ...state,
        searchCriteria: {
          ...searchCriteria,
          [fieldName]: value
        }
      }));
    } else if (!hasValidValues) {
      setState((state) => ({
        ...state,
        searchCriteria: {
          enrolleeId: "",
          firstName: "",
          lastName: "",
          mobileNo: "",
          email: ""
        }
      }));
    }
  };

  useEffect(() => {
    const hasAnyValue = Object.values(searchCriteria).some(value => value.trim() !== "");

    if (!hasAnyValue) {
      setState((state) => ({
        ...state,
        searchCriteria: {
          enrolleeId: "",
          firstName: "",
          lastName: "",
          mobileNo: "",
          email: ""
        }
      }));
    }
  }, [searchCriteria, setState]);

  return {
    searchCriteria,
    handleChange,
    handleBlur,
    validation
  };
}
