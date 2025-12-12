import React, { forwardRef, useState } from 'react';
import { AlertCircle, Phone } from 'lucide-react';

interface PhoneInputProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const countryCodes = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+32', country: 'BE', flag: '🇧🇪' },
  { code: '+48', country: 'PL', flag: '🇵🇱' },
];

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, value = '', onChange, required, disabled, placeholder = 'Phone number' }, ref) => {
    const parsePhoneValue = (fullValue: string) => {
      const matchedCode = countryCodes.find(c => fullValue.startsWith(c.code));
      if (matchedCode) {
        return {
          countryCode: matchedCode.code,
          phoneNumber: fullValue.substring(matchedCode.code.length).trim()
        };
      }
      return {
        countryCode: '+1',
        phoneNumber: fullValue.replace(/^\+/, '')
      };
    };

    const { countryCode: initialCode, phoneNumber: initialNumber } = parsePhoneValue(value);
    const [selectedCode, setSelectedCode] = useState(initialCode);
    const [phoneNumber, setPhoneNumber] = useState(initialNumber);

    const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCode = e.target.value;
      setSelectedCode(newCode);
      if (onChange) {
        onChange(`${newCode}${phoneNumber}`);
      }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPhone = e.target.value.replace(/[^\d]/g, '');
      setPhoneNumber(newPhone);
      if (onChange) {
        onChange(`${selectedCode}${newPhone}`);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative flex gap-2">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={selectedCode}
              onChange={handleCodeChange}
              disabled={disabled}
              className="
                pl-10 pr-3 py-2 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                appearance-none bg-white
                min-w-[100px]
                ${error ? 'border-red-500' : 'border-gray-300'}
              "
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
          </div>

          <input
            ref={ref}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-gray-300'}
            `}
          />
        </div>
        {error && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
