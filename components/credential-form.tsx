"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface FieldConfig {
  name: string;
  label: string;
  type: string;
}

interface CredentialFormProps {
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function CredentialForm({ fields, values, onChange }: CredentialFormProps) {
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3 max-w-md">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block font-body text-sm font-medium text-gray-600 mb-1">{field.label}</label>
          <div className="relative">
            <input
              type={field.type === "password" && !showPassword[field.name] ? "password" : "text"}
              value={values[field.name] || ""}
              onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 font-body text-gray-900 placeholder:text-gray-400 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/20 outline-none transition-all text-sm"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
            {field.type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, [field.name]: !showPassword[field.name] })}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
