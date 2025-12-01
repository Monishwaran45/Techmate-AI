import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  sanitizeInput,
  sanitizeHtml,
  IsSanitizedString,
} from './sanitize.validator';
import {
  IsFutureDate,
  IsNotSqlInjection,
  IsNotXss,
  IsSlug,
  IsUniqueArray,
  IsNotPathTraversal,
  IsReasonableNumber,
} from './custom-validators';

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should remove control characters', () => {
      const input = 'hello\x00\x01\x02world';
      const result = sanitizeInput(input);
      expect(result).toBe('helloworld');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove iframe tags', () => {
      const input = '<div>Content</div><iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe>');
    });

    it('should remove event handlers', () => {
      const input = '<button onclick="alert()">Click</button>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert()">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('IsSanitizedString decorator', () => {
    class TestDto {
      @IsSanitizedString(100)
      content: string;
    }

    it('should accept clean strings', async () => {
      const dto = plainToClass(TestDto, { content: 'Hello World' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject strings with SQL injection patterns', async () => {
      const dto = plainToClass(TestDto, {
        content: "'; DROP TABLE users; --",
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject strings with XSS patterns', async () => {
      const dto = plainToClass(TestDto, {
        content: '<script>alert("xss")</script>',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject strings exceeding max length', async () => {
      const dto = plainToClass(TestDto, { content: 'a'.repeat(101) });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Custom Validators', () => {
  describe('IsFutureDate', () => {
    class TestDto {
      @IsFutureDate()
      scheduledDate: string;
    }

    it('should accept future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dto = plainToClass(TestDto, {
        scheduledDate: futureDate.toISOString(),
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dto = plainToClass(TestDto, {
        scheduledDate: pastDate.toISOString(),
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsNotSqlInjection', () => {
    class TestDto {
      @IsNotSqlInjection()
      query: string;
    }

    it('should accept clean strings', async () => {
      const dto = plainToClass(TestDto, { query: 'search term' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject SQL injection patterns', async () => {
      const patterns = [
        "'; DROP TABLE users; --",
        'SELECT * FROM users',
        '1 OR 1=1',
        'UNION SELECT password FROM users',
      ];

      for (const pattern of patterns) {
        const dto = plainToClass(TestDto, { query: pattern });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IsNotXss', () => {
    class TestDto {
      @IsNotXss()
      content: string;
    }

    it('should accept clean HTML', async () => {
      const dto = plainToClass(TestDto, { content: '<p>Hello World</p>' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject XSS patterns', async () => {
      const patterns = [
        '<script>alert("xss")</script>',
        '<iframe src="evil.com"></iframe>',
        '<img onerror="alert()" src="x">',
        'javascript:alert()',
      ];

      for (const pattern of patterns) {
        const dto = plainToClass(TestDto, { content: pattern });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IsSlug', () => {
    class TestDto {
      @IsSlug()
      slug: string;
    }

    it('should accept valid slugs', async () => {
      const validSlugs = ['hello-world', 'my-project-123', 'test'];

      for (const slug of validSlugs) {
        const dto = plainToClass(TestDto, { slug });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid slugs', async () => {
      const invalidSlugs = [
        'Hello World',
        'my_project',
        'test@123',
        'UPPERCASE',
      ];

      for (const slug of invalidSlugs) {
        const dto = plainToClass(TestDto, { slug });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IsUniqueArray', () => {
    class TestDto {
      @IsUniqueArray()
      items: string[];
    }

    it('should accept arrays with unique values', async () => {
      const dto = plainToClass(TestDto, { items: ['a', 'b', 'c'] });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject arrays with duplicate values', async () => {
      const dto = plainToClass(TestDto, { items: ['a', 'b', 'a'] });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsNotPathTraversal', () => {
    class TestDto {
      @IsNotPathTraversal()
      path: string;
    }

    it('should accept clean paths', async () => {
      const dto = plainToClass(TestDto, { path: 'folder/file.txt' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject path traversal patterns', async () => {
      const patterns = ['../etc/passwd', '..\\windows\\system32', '%2e%2e/'];

      for (const pattern of patterns) {
        const dto = plainToClass(TestDto, { path: pattern });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IsReasonableNumber', () => {
    class TestDto {
      @IsReasonableNumber()
      value: number;
    }

    it('should accept reasonable numbers', async () => {
      const dto = plainToClass(TestDto, { value: 42 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject NaN', async () => {
      const dto = plainToClass(TestDto, { value: NaN });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject Infinity', async () => {
      const dto = plainToClass(TestDto, { value: Infinity });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject extremely large numbers', async () => {
      const dto = plainToClass(TestDto, {
        value: Number.MAX_SAFE_INTEGER + 1,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
