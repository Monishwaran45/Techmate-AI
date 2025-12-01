import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { User, UserProfile, Subscription } from '../../entities';
import { RegisterDto } from './dto/register.dto';
import { emailArbitrary, roleArbitrary, passwordArbitrary } from '../../test/generators';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProfileRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash passwords consistently', async () => {
      const password = 'TestPassword123!';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      // Hashes should be different (due to salt)
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await service.comparePasswords(password, hash1)).toBe(true);
      expect(await service.comparePasswords(password, hash2)).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await service.hashPassword(password);

      expect(await service.comparePasswords(wrongPassword, hash)).toBe(false);
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 1: Registration creates valid accounts**
   * **Validates: Requirements 1.1**
   * 
   * For any valid registration credentials (email, password, role), creating an account
   * should result in a persisted user with encrypted password storage.
   */
  describe('Property 1: Registration creates valid accounts', () => {
    it('should create valid accounts for any valid registration data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: emailArbitrary,
            password: passwordArbitrary,
            name: fc.string({ minLength: 1, maxLength: 100 }),
            role: roleArbitrary,
          }),
          async (registerData) => {
            // Setup mocks
            mockUserRepository.findOne.mockResolvedValue(null); // No existing user
            mockUserRepository.create.mockReturnValue({ id: 'test-id', ...registerData });
            mockUserRepository.save.mockResolvedValue({
              id: 'test-id',
              email: registerData.email,
              role: registerData.role,
            });
            mockProfileRepository.create.mockReturnValue({});
            mockProfileRepository.save.mockResolvedValue({});
            mockSubscriptionRepository.create.mockReturnValue({});
            mockSubscriptionRepository.save.mockResolvedValue({});
            mockJwtService.sign.mockReturnValue('mock-token');

            const registerDto: RegisterDto = registerData as RegisterDto;
            const result = await service.register(registerDto);

            // Verify user was created
            expect(mockUserRepository.create).toHaveBeenCalled();
            expect(mockUserRepository.save).toHaveBeenCalled();

            // Verify password was hashed (not stored in plain text)
            const createCall = mockUserRepository.create.mock.calls[0][0];
            expect(createCall.passwordHash).toBeDefined();
            expect(createCall.passwordHash).not.toBe(registerData.password);

            // Verify profile was created
            expect(mockProfileRepository.create).toHaveBeenCalled();
            expect(mockProfileRepository.save).toHaveBeenCalled();

            // Verify subscription was created
            expect(mockSubscriptionRepository.create).toHaveBeenCalled();
            expect(mockSubscriptionRepository.save).toHaveBeenCalled();

            // Verify tokens were generated
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(registerData.email);
          }
        ),
        { numRuns: 10 }  // Reduced due to slow password hashing
      );
    }, 60000);  // 60 second timeout for property test with password hashing
  });

  /**
   * **Feature: techmate-ai-platform, Property 2: Valid credentials produce valid tokens**
   * **Validates: Requirements 1.2**
   * 
   * For any registered user with valid credentials, login should return a valid JWT token
   * that can be used for authentication.
   */
  describe('Property 2: Valid credentials produce valid tokens', () => {
    it('should produce valid tokens for any valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: emailArbitrary,
            password: passwordArbitrary,
            role: roleArbitrary,
          }),
          async (userData) => {
            // Hash the password as it would be stored
            const passwordHash = await service.hashPassword(userData.password);

            // Setup mock user
            const mockUser = {
              id: 'test-user-id',
              email: userData.email,
              passwordHash,
              role: userData.role,
              twoFactorEnabled: false,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('mock-jwt-token');

            // Attempt login
            const result = await service.login({
              email: userData.email,
              password: userData.password,
            });

            // Verify tokens were generated (cast to any to handle union type)
            const loginResult = result as any;
            expect(loginResult.accessToken).toBeDefined();
            expect(loginResult.refreshToken).toBeDefined();
            expect(loginResult.user).toBeDefined();
            expect(loginResult.user.email).toBe(userData.email);
            expect(loginResult.user.role).toBe(userData.role);

            // Verify JWT service was called to create tokens
            expect(mockJwtService.sign).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }  // Reduced due to slow password hashing
      );
    }, 60000);  // 60 second timeout

    it('should reject invalid passwords for any user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: emailArbitrary,
            correctPassword: passwordArbitrary,
            wrongPassword: passwordArbitrary,
          }),
          async (userData) => {
            // Skip if passwords happen to be the same
            fc.pre(userData.correctPassword !== userData.wrongPassword);

            const passwordHash = await service.hashPassword(userData.correctPassword);

            const mockUser = {
              id: 'test-user-id',
              email: userData.email,
              passwordHash,
              twoFactorEnabled: false,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);

            // Attempt login with wrong password should throw
            await expect(
              service.login({
                email: userData.email,
                password: userData.wrongPassword,
              })
            ).rejects.toThrow('Invalid credentials');
          }
        ),
        { numRuns: 10 }  // Reduced due to slow password hashing
      );
    }, 60000);  // 60 second timeout
  });

  /**
   * **Feature: techmate-ai-platform, Property 4: Expired tokens are rejected**
   * **Validates: Requirements 1.4**
   * 
   * For any expired JWT token, attempting to access protected resources should result
   * in authentication failure.
   */
  describe('Property 4: Expired tokens are rejected', () => {
    it('should reject expired refresh tokens', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 10 }), async (expiredToken) => {
          // Mock JWT verification to throw expired error
          mockJwtService.verify.mockImplementation(() => {
            throw new Error('jwt expired');
          });

          // Attempt to refresh with expired token should throw
          await expect(service.refreshToken(expiredToken)).rejects.toThrow(
            'Invalid or expired refresh token'
          );
        }),
        { numRuns: 50 }
      );
    });

    it('should reject invalid tokens', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 10 }), async (invalidToken) => {
          // Mock JWT verification to throw invalid error
          mockJwtService.verify.mockImplementation(() => {
            throw new Error('invalid token');
          });

          // Attempt to refresh with invalid token should throw
          await expect(service.refreshToken(invalidToken)).rejects.toThrow(
            'Invalid or expired refresh token'
          );
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 5: 2FA enforcement**
   * **Validates: Requirements 1.5**
   * 
   * For any user with 2FA enabled, all login attempts should require secondary
   * verification before issuing tokens.
   */
  describe('Property 5: 2FA enforcement', () => {
    it('should require 2FA verification for users with 2FA enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: emailArbitrary,
            password: passwordArbitrary,
          }),
          async (userData) => {
            const passwordHash = await service.hashPassword(userData.password);

            // Mock user with 2FA enabled
            const mockUser = {
              id: 'test-user-id',
              email: userData.email,
              passwordHash,
              twoFactorEnabled: true,
              twoFactorSecret: 'test-secret',
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('temp-token');

            // Login should return temp token, not full tokens
            const result = await service.login({
              email: userData.email,
              password: userData.password,
            });

            // Cast to any to handle union type
            const twoFactorResult = result as any;
            expect(twoFactorResult.requiresTwoFactor).toBe(true);
            expect(twoFactorResult.tempToken).toBeDefined();
            expect(twoFactorResult.accessToken).toBeUndefined();
            expect(twoFactorResult.refreshToken).toBeUndefined();
          }
        ),
        { numRuns: 10 }  // Reduced due to slow password hashing
      );
    }, 60000);  // 60 second timeout

    it('should not require 2FA for users without 2FA enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: emailArbitrary,
            password: passwordArbitrary,
          }),
          async (userData) => {
            const passwordHash = await service.hashPassword(userData.password);

            // Mock user without 2FA
            const mockUser = {
              id: 'test-user-id',
              email: userData.email,
              passwordHash,
              twoFactorEnabled: false,
            } as User;

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('mock-token');

            // Login should return full tokens
            const result = await service.login({
              email: userData.email,
              password: userData.password,
            });

            // Cast to any to handle union type
            const normalResult = result as any;
            expect(normalResult.requiresTwoFactor).toBeUndefined();
            expect(normalResult.accessToken).toBeDefined();
            expect(normalResult.refreshToken).toBeDefined();
          }
        ),
        { numRuns: 10 }  // Reduced due to slow password hashing
      );
    }, 60000);  // 60 second timeout
  });

  /**
   * **Feature: techmate-ai-platform, Property 3: Profile update round-trip**
   * **Validates: Requirements 1.3**
   * 
   * For any valid profile update data, updating a profile then retrieving it
   * should return the same data.
   */
  describe('Property 3: Profile update round-trip', () => {
    it('should preserve profile data through update and retrieval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
              minLength: 0,
              maxLength: 20,
            }),
            goals: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
              minLength: 0,
              maxLength: 10,
            }),
            experience: fc.constantFrom('beginner', 'intermediate', 'advanced', 'expert'),
          }),
          async (profileData) => {
            // Clear mocks at start of each iteration
            jest.clearAllMocks();
            
            const userId = 'test-user-id';

            // Mock existing profile
            const existingProfile = {
              id: 'profile-id',
              userId,
              name: 'Old Name',
              skills: [],
              goals: [],
              experience: 'beginner',
              preferences: { theme: 'light' as const, notifications: true, language: 'en' },
            } as UserProfile;

            mockProfileRepository.findOne.mockResolvedValue(existingProfile);
            mockProfileRepository.save.mockImplementation((profile) => Promise.resolve(profile));

            // Update profile
            await service.updateProfile(userId, profileData);

            // Verify save was called with updated data
            const savedProfile = mockProfileRepository.save.mock.calls[0][0];
            expect(savedProfile.name).toBe(profileData.name);
            expect(savedProfile.skills).toEqual(profileData.skills);
            expect(savedProfile.goals).toEqual(profileData.goals);
            expect(savedProfile.experience).toBe(profileData.experience);
          }
        ),
        { numRuns: 50 }  // Reduced for faster execution
      );
    });

    it('should preserve preferences through partial updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            theme: fc.constantFrom('light', 'dark'),
            notifications: fc.boolean(),
            language: fc.constantFrom('en', 'es', 'fr', 'de'),
          }),
          async (newPreferences) => {
            // Clear mocks at start of each iteration
            jest.clearAllMocks();
            
            const userId = 'test-user-id';

            const existingProfile = {
              id: 'profile-id',
              userId,
              name: 'Test User',
              skills: [],
              goals: [],
              experience: 'beginner',
              preferences: { theme: 'light' as const, notifications: false, language: 'en' },
            } as UserProfile;

            mockProfileRepository.findOne.mockResolvedValue(existingProfile);
            mockProfileRepository.save.mockImplementation((profile) => Promise.resolve(profile));

            // Update only preferences (cast to handle type)
            await service.updateProfile(userId, { preferences: newPreferences as any });

            // Verify preferences were merged correctly
            const savedProfile = mockProfileRepository.save.mock.calls[0][0];
            expect(savedProfile.preferences.theme).toBe(newPreferences.theme);
            expect(savedProfile.preferences.notifications).toBe(newPreferences.notifications);
            expect(savedProfile.preferences.language).toBe(newPreferences.language);
          }
        ),
        { numRuns: 25 }  // Reduced for faster execution
      );
    });
  });

  describe('Token Generation', () => {
    it('should generate valid JWT tokens', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'developer' as const,
      } as User;

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const tokens = await service.generateTokens(mockUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(3600);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
