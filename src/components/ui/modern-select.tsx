import { useState, useRef, useEffect } from "react";

import { Check, ChevronDown } from "@/components/icons";

interface SelectOption {
  key: string;
  label: string;
}

interface ModernSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  isRequired?: boolean;
}

export default function ModernSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  isRequired = false,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.key === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionKey: string) => {
    onChange(optionKey);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        className={`
          w-full px-4 py-2.5 text-left bg-white border-2 rounded-lg
          transition-all duration-200 ease-in-out
          flex items-center justify-between
          ${
            isOpen
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-300 hover:border-gray-400"
          }
          ${!selectedOption ? "text-gray-400" : "text-gray-900"}
        `}
        type="button"
        onClick={handleToggle}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`
            w-5 h-5 text-gray-500 transition-transform duration-200
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown Options - Fixed positioning to pop out */}
      {isOpen && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] min-w-[200px]"
          style={{
            top: containerRef.current
              ? `${containerRef.current.getBoundingClientRect().bottom + 8}px`
              : "0px",
            left: containerRef.current
              ? `${containerRef.current.getBoundingClientRect().left}px`
              : "0px",
            width: containerRef.current
              ? `${containerRef.current.getBoundingClientRect().width}px`
              : "auto",
          }}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.key === value;

              return (
                <button
                  key={option.key}
                  className={`
                  w-full px-4 py-3 text-left flex items-center justify-between
                  transition-colors duration-150
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-900 hover:bg-gray-50"
                  }
                `}
                  type="button"
                  onClick={() => handleSelect(option.key)}
                >
                  <span className="font-medium">{option.label}</span>
                  {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
