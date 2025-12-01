# Input Validation and Sanitization

This directory contains custom validators and sanitization utilities for the TechMate AI backend.

## Overview

The validation infrastructure provides comprehensive input validation and sanitization to protect against:
- SQL Injection attacks
- Cross-Site Scripting (XSS) attacks
- Path Traversal attacks
- Malicious file uploads
- Invalid data formats
- Buffer overflow attempts

## Global Validation Configuration

Configured in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    validationError: {
      target: false,
      value: false,
    },
  })
);
```

## Custom Validators

### `@IsSanitizedString(maxLength: number)`

Validates and sanitizes string input by checking for SQL injection and XSS patterns.

```typescript
class CreatePostDto {
  @IsSanitizedString(1000)
  content: string;
}
```

### `@IsFutureDate()`

Validates that a date is in the future.

```typescript
class CreateReminderDto {
  @IsFutureDate()
  scheduledFor: string;
}
```

### `@IsNotSqlInjection()`

Validates that a string doesn't contain SQL injection patterns.

### `@IsNotXss()`

Validates that a string doesn't contain XSS patterns.

### `@IsSlug()`

Validates URL-friendly slugs (lowercase, hyphens only).

### `@IsUniqueArray()`

Validates that an array contains only unique values.

### `@IsNotPathTraversal()`

Validates that a string doesn't contain path traversal patterns.

### `@IsReasonableNumber()`

Validates that a number is finite and within safe integer range.

### `@IsHexColor()`

Validates hex color codes.

## File Validation

### FileValidationPipe

Comprehensive file upload validation:

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(
  @UploadedFile(
    new FileValidationPipe({
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: ['application/pdf'],
      allowedExtensions: ['pdf'],
    })
  )
  file: Express.Multer.File,
) {}
```

**Predefined Validators:**
- `ResumeFileValidation`: PDF, DOC, DOCX (5MB max)
- `ImageFileValidation`: JPG, PNG, GIF (2MB max)

## Sanitization Functions

### `sanitizeHtml(html: string)`

Removes dangerous HTML tags and attributes.

### `sanitizeInput(input: string)`

Trims whitespace and removes control characters.

## Best Practices

### 1. Always Validate Input

```typescript
class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}
```

### 2. Sanitize User Content

```typescript
class CreatePostDto {
  @IsSanitizedString(1000)
  @Transform(({ value }) => value?.trim())
  content: string;
}
```

### 3. Validate Arrays

```typescript
class UpdateProfileDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  skills: string[];
}
```

### 4. Use Enums for Fixed Values

```typescript
class CreateTaskDto {
  @IsEnum(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';
}
```

### 5. Validate UUIDs

```typescript
class GetProjectDto {
  @IsUUID('4')
  projectId: string;
}
```

## Security Checklist

- [x] All DTOs have validation decorators
- [x] String fields have MaxLength constraints
- [x] Email fields use IsEmail validator
- [x] Enum fields use IsEnum validator
- [x] File uploads use FileValidationPipe
- [x] HTML content is sanitized
- [x] User input is trimmed and normalized
- [x] Arrays have size limits
- [x] Dates use IsDateString validator
- [x] SQL injection prevention
- [x] XSS prevention
- [x] Path traversal prevention
