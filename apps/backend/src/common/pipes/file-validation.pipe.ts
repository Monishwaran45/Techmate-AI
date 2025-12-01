import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  requireExtension?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly dangerousExtensions = [
    'exe',
    'bat',
    'cmd',
    'com',
    'pif',
    'scr',
    'vbs',
    'js',
    'jar',
    'sh',
    'app',
    'deb',
    'rpm',
  ];

  constructor(private readonly options: FileValidationOptions = {}) {
    this.options.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    this.options.allowedMimeTypes = options.allowedMimeTypes || [];
    this.options.allowedExtensions = options.allowedExtensions || [];
    this.options.requireExtension =
      options.requireExtension !== undefined ? options.requireExtension : true;
  }

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file exists and has content
    if (!file.buffer && !file.path) {
      throw new BadRequestException('File content is missing');
    }

    // Validate file size (minimum)
    if (file.size === 0) {
      throw new BadRequestException('File is empty');
    }

    // Validate file size (maximum)
    if (file.size > this.options.maxSize!) {
      const maxSizeMB = this.options.maxSize! / (1024 * 1024);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Validate filename exists
    if (!file.originalname || file.originalname.trim() === '') {
      throw new BadRequestException('Filename is required');
    }

    // Validate filename length
    if (file.originalname.length > 255) {
      throw new BadRequestException(
        'Filename must not exceed 255 characters',
      );
    }

    // Validate filename (prevent path traversal)
    if (
      file.originalname.includes('..') ||
      file.originalname.includes('/') ||
      file.originalname.includes('\\')
    ) {
      throw new BadRequestException(
        'Invalid filename: path traversal detected',
      );
    }

    // Validate filename doesn't start with dot (hidden files)
    if (file.originalname.startsWith('.')) {
      throw new BadRequestException('Hidden files are not allowed');
    }

    // Extract and validate file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (this.options.requireExtension && !fileExtension) {
      throw new BadRequestException('File must have an extension');
    }

    // Check for dangerous extensions
    if (fileExtension && this.dangerousExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File extension .${fileExtension} is not allowed for security reasons`,
      );
    }

    // Validate against allowed extensions
    if (this.options.allowedExtensions!.length > 0) {
      if (
        !fileExtension ||
        !this.options.allowedExtensions!.includes(fileExtension)
      ) {
        throw new BadRequestException(
          `File extension .${fileExtension} is not allowed. Allowed extensions: ${this.options.allowedExtensions!.join(', ')}`,
        );
      }
    }

    // Validate MIME type
    if (
      this.options.allowedMimeTypes!.length > 0 &&
      !this.options.allowedMimeTypes!.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.options.allowedMimeTypes!.join(', ')}`,
      );
    }

    // Validate MIME type matches extension (basic check)
    if (fileExtension && file.mimetype) {
      const isValidMimeType = this.validateMimeTypeMatchesExtension(
        fileExtension,
        file.mimetype,
      );
      if (!isValidMimeType) {
        throw new BadRequestException(
          'File extension does not match file content type',
        );
      }
    }

    return file;
  }

  /**
   * Basic validation that MIME type matches file extension
   */
  private validateMimeTypeMatchesExtension(
    extension: string,
    mimeType: string,
  ): boolean {
    const mimeTypeMap: Record<string, string[]> = {
      pdf: ['application/pdf'],
      doc: ['application/msword'],
      docx: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      txt: ['text/plain'],
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      gif: ['image/gif'],
      svg: ['image/svg+xml'],
      mp3: ['audio/mpeg'],
      mp4: ['video/mp4'],
      zip: ['application/zip'],
      json: ['application/json'],
      xml: ['application/xml', 'text/xml'],
      csv: ['text/csv'],
    };

    const expectedMimeTypes = mimeTypeMap[extension];
    if (!expectedMimeTypes) {
      // If we don't have a mapping, allow it (permissive for unknown types)
      return true;
    }

    return expectedMimeTypes.includes(mimeType);
  }
}

// Predefined file validation configurations
export const ResumeFileValidation = new FileValidationPipe({
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedExtensions: ['pdf', 'doc', 'docx'],
});

export const ImageFileValidation = new FileValidationPipe({
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
});
