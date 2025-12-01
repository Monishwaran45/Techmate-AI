import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Sanitizes string input by removing potentially dangerous characters
 * and limiting length
 */
export function IsSanitizedString(
  maxLength: number = 1000,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSanitizedString',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxLength],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          const [maxLen] = args.constraints;

          // Check length
          if (value.length > maxLen) {
            return false;
          }

          // Check for SQL injection patterns
          const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
            /(--|;|\/\*|\*\/|xp_|sp_)/gi,
          ];

          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return false;
            }
          }

          // Check for XSS patterns
          const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi, // Event handlers like onclick=
          ];

          for (const pattern of xssPatterns) {
            if (pattern.test(value)) {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains invalid or potentially dangerous content`;
        },
      },
    });
  };
}

/**
 * Validates file upload size and type
 */
export function IsValidFile(
  allowedTypes: string[],
  maxSizeInMB: number = 10,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidFile',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [allowedTypes, maxSizeInMB],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }

          const [types, maxSize] = args.constraints;
          const file = value as Express.Multer.File;

          // Check file size
          const maxSizeInBytes = maxSize * 1024 * 1024;
          if (file.size > maxSizeInBytes) {
            return false;
          }

          // Check file type
          const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
          if (!fileExtension || !types.includes(fileExtension)) {
            return false;
          }

          // Check MIME type
          const allowedMimeTypes = types.map((ext: string) => {
            const mimeMap: Record<string, string> = {
              pdf: 'application/pdf',
              doc: 'application/msword',
              docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              txt: 'text/plain',
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
            };
            return mimeMap[ext];
          });

          if (!allowedMimeTypes.includes(file.mimetype)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [types, maxSize] = args.constraints;
          return `File must be one of [${types.join(', ')}] and smaller than ${maxSize}MB`;
        },
      },
    });
  };
}

/**
 * Sanitizes HTML content by removing dangerous tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Sanitizes user input by trimming and removing control characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}
