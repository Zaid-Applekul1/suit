/**
 * Phone Number Validation and Formatting Utilities
 * Ensures phone numbers are in E.164 format for Twilio/Supabase
 */

/**
 * Validates if a phone number is in correct E.164 format
 * E.164 format: +[country code][number] (e.g., +919876543210, +14155552671)
 */
export const isValidE164PhoneNumber = (phone: string): boolean => {
  // E.164 regex: starts with +, followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

/**
 * Formats a phone number to E.164 format
 * Handles common input formats and converts them
 */
export const formatPhoneToE164 = (phone: string, defaultCountryCode: string = '91'): string => {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If it already starts with +, validate and return
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If it starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }

  // If it starts with 0, remove it (common in many countries)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If no country code, add default
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + defaultCountryCode + cleaned;
  }

  return cleaned;
};

/**
 * Validates phone number length for specific countries
 */
export const validatePhoneNumberLength = (phone: string): { valid: boolean; message: string } => {
  const cleaned = phone.replace(/[^\d]/g, '');

  // Common country-specific validations
  const countryRules: Record<string, { minLength: number; maxLength: number; name: string }> = {
    '91': { minLength: 10, maxLength: 10, name: 'India' },      // India: 10 digits after +91
    '1': { minLength: 10, maxLength: 10, name: 'USA/Canada' },  // USA/Canada: 10 digits after +1
    '44': { minLength: 10, maxLength: 10, name: 'UK' },         // UK: 10 digits after +44
    '92': { minLength: 10, maxLength: 10, name: 'Pakistan' },   // Pakistan: 10 digits after +92
    '968': { minLength: 8, maxLength: 8, name: 'Oman' },        // Oman: 8 digits after +968
    '971': { minLength: 9, maxLength: 9, name: 'UAE' },         // UAE: 9 digits after +971
    '966': { minLength: 9, maxLength: 9, name: 'Saudi Arabia' },// Saudi: 9 digits after +966
  };

  // Extract country code
  if (phone.startsWith('+')) {
    for (const [code, rules] of Object.entries(countryRules)) {
      if (phone.startsWith('+' + code)) {
        const numberWithoutCode = cleaned.substring(code.length);
        const length = numberWithoutCode.length;

        if (length < rules.minLength) {
          return {
            valid: false,
            message: `${rules.name} phone numbers require ${rules.minLength} digits. You entered ${length} digits.`
          };
        }
        if (length > rules.maxLength) {
          return {
            valid: false,
            message: `${rules.name} phone numbers require ${rules.maxLength} digits. You entered ${length} digits.`
          };
        }
        return { valid: true, message: 'Valid phone number' };
      }
    }
  }

  // Generic validation for unknown country codes
  if (cleaned.length < 8) {
    return { valid: false, message: 'Phone number is too short. Please include country code.' };
  }
  if (cleaned.length > 15) {
    return { valid: false, message: 'Phone number is too long. Maximum 15 digits allowed.' };
  }

  return { valid: true, message: 'Valid phone number' };
};

/**
 * Get country name from phone number
 */
export const getCountryFromPhone = (phone: string): string => {
  const countryNames: Record<string, string> = {
    '91': 'India',
    '1': 'USA/Canada',
    '44': 'UK',
    '92': 'Pakistan',
    '968': 'Oman',
    '971': 'UAE',
    '966': 'Saudi Arabia',
    '86': 'China',
    '81': 'Japan',
    '49': 'Germany',
    '33': 'France',
    '39': 'Italy',
    '34': 'Spain',
    '61': 'Australia',
    '55': 'Brazil',
    '52': 'Mexico',
  };

  if (phone.startsWith('+')) {
    for (const [code, name] of Object.entries(countryNames)) {
      if (phone.startsWith('+' + code)) {
        return name;
      }
    }
  }

  return 'Unknown';
};

/**
 * Comprehensive phone validation
 */
export const validatePhone = (phone: string, defaultCountryCode: string = '91'): {
  valid: boolean;
  formatted: string;
  message: string;
  country: string;
} => {
  if (!phone || phone.trim() === '') {
    return {
      valid: false,
      formatted: '',
      message: 'Phone number is required',
      country: 'Unknown'
    };
  }

  // Format to E.164
  const formatted = formatPhoneToE164(phone, defaultCountryCode);

  // Validate E.164 format
  if (!isValidE164PhoneNumber(formatted)) {
    return {
      valid: false,
      formatted,
      message: 'Invalid phone number format. Use E.164 format: +[country code][number]',
      country: 'Unknown'
    };
  }

  // Validate length
  const lengthValidation = validatePhoneNumberLength(formatted);
  if (!lengthValidation.valid) {
    return {
      valid: false,
      formatted,
      message: lengthValidation.message,
      country: getCountryFromPhone(formatted)
    };
  }

  return {
    valid: true,
    formatted,
    message: 'Valid phone number',
    country: getCountryFromPhone(formatted)
  };
};

/**
 * Format phone number for display (with spaces/dashes for readability)
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone.startsWith('+')) return phone;

  // India: +91 98765 43210
  if (phone.startsWith('+91') && phone.length === 13) {
    return `+91 ${phone.substring(3, 8)} ${phone.substring(8)}`;
  }

  // USA/Canada: +1 (415) 555-2671
  if (phone.startsWith('+1') && phone.length === 12) {
    return `+1 (${phone.substring(2, 5)}) ${phone.substring(5, 8)}-${phone.substring(8)}`;
  }

  // Oman: +968 9123 4567
  if (phone.startsWith('+968') && phone.length === 12) {
    return `+968 ${phone.substring(4, 8)} ${phone.substring(8)}`;
  }

  // UAE: +971 50 123 4567
  if (phone.startsWith('+971') && phone.length === 13) {
    return `+971 ${phone.substring(4, 6)} ${phone.substring(6, 9)} ${phone.substring(9)}`;
  }

  // Default: just add space after country code
  const match = phone.match(/^(\+\d{1,3})(\d+)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return phone;
};
