import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { sanitizeInput, sanitizeHtml } from '../validators/sanitize.validator';

/**
 * Enhanced validation pipe with automatic input sanitization
 */
@Injectable()
export class EnhancedValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
      validationError: {
        target: false, // Don't expose target object in errors
        value: false, // Don't expose value in errors (security)
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: messages,
        });
      },
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    // Sanitize string inputs before validation
    if (value && typeof value === 'object') {
      value = this.sanitizeObject(value);
    }

    return super.transform(value, metadata);
  }

  /**
   * Recursively sanitize all string properties in an object
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeInput(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * Pipe for validating and sanitizing HTML content
 */
@Injectable()
export class HtmlSanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return sanitizeHtml(value);
    }

    if (value && typeof value === 'object') {
      return this.sanitizeHtmlInObject(value);
    }

    return value;
  }

  private sanitizeHtmlInObject(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeHtml(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeHtmlInObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeHtmlInObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * Pipe for trimming whitespace from string inputs
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (value && typeof value === 'object') {
      return this.trimObject(value);
    }

    return value;
  }

  private trimObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.trimObject(item));
    }

    if (obj && typeof obj === 'object') {
      const trimmed: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          trimmed[key] = this.trimObject(obj[key]);
        }
      }
      return trimmed;
    }

    return obj;
  }
}
