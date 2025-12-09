'use client';

import React, { useState } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const countryCodes = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+27', country: 'ZA' },
  { code: '+234', country: 'NG' },
  { code: '+254', country: 'KE' },
  { code: '+233', country: 'GH' },
  { code: '+20', country: 'EG' },
  { code: '+212', country: 'MA' },
  { code: '+91', country: 'IN' },
  { code: '+86', country: 'CN' },
  { code: '+81', country: 'JP' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' },
  { code: '+55', country: 'BR' },
  { code: '+61', country: 'AU' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}) => {
  const [countryCode, setCountryCode] = useState('+1');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, '');
    onChange(countryCode + phone);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    const phoneNumber = value.replace(/^\+\d+/, '');
    onChange(newCode + phoneNumber);
  };

  const displayValue = value.replace(countryCode, '');

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className="w-28 border border-gray-300 rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {countryCodes.map((country) => (
            <option key={country.code} value={country.code}>
              {country.code} {country.country}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="tel"
            placeholder={placeholder}
            value={displayValue}
            onChange={handlePhoneChange}
            required={required}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};
