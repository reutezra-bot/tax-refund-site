export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateContactForm(data: {
  fullName: string;
  phone: string;
  email: string;
  termsAccepted: boolean;
  processingAccepted: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName.trim()) {
    errors.fullName = 'שם מלא הוא שדה חובה';
  }

  const cleanPhone = data.phone.replace(/[-\s]/g, '');
  if (!cleanPhone || !/^0[2-9]\d{7,8}$/.test(cleanPhone)) {
    errors.phone = 'נא להזין מספר טלפון תקין';
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'נא להזין כתובת אימייל תקינה';
  }

  if (!data.termsAccepted) {
    errors.termsAccepted = 'יש לאשר את תנאי השימוש';
  }

  if (!data.processingAccepted) {
    errors.processingAccepted = 'יש לאשר עיבוד מידע';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateUpload(files: File[]): string | null {
  if (files.length === 0) return 'יש להעלות לפחות קובץ אחד';

  const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];
  const MAX_SIZE = 10 * 1024 * 1024;

  for (const file of files) {
    if (!ACCEPTED.includes(file.type)) {
      return `הקובץ "${file.name}" אינו בפורמט נתמך. יש להעלות PDF, JPG, או PNG`;
    }
    if (file.size > MAX_SIZE) {
      return `הקובץ "${file.name}" גדול מדי. גודל מקסימלי: 10MB`;
    }
  }
  return null;
}
