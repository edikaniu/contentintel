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
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{field.label}</label>
          <div className="relative">
            <input
              type={field.type === "password" && !showPassword[field.name] ? "password" : "text"}
              value={values[field.name] || ""}
              onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
              className="w-full bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
            {field.type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, [field.name]: !showPassword[field.name] })}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
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
