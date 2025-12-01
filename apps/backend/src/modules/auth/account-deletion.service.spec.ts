import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { AccountDeletionService } from './account-deletion.service';
import { User } from '../../entities/user.entity';

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeletionService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountDeletionService>(AccountDeletionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDeleteAccount', () => {
    it('should mark account for deletion with 30-day retention', async () => {
      const userId = 'test-user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        deletedAt: null,
        permanentDeletionAt: null,
      } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      await service.softDeleteAccount(userId);

      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = (userRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.deletedAt).toBeDefined();
      expect(savedUser.permanentDeletionAt).toBeDefined();
    });
  });

  describe('permanentlyDeleteExpiredAccounts', () => {
    it('should delete accounts past retention period', async () => {
      const expiredUser = {
        id: 'expired-user',
        permanentDeletionAt: new Date(Date.now() - 1000),
      } as User;

      jest.spyOn(userRepository, 'find').mockResolvedValue([expiredUser]);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(expiredUser);

      const count = await service.permanentlyDeleteExpiredAccounts();

      expect(count).toBe(1);
      expect(userRepository.remove).toHaveBeenCalledWith(expiredUser);
    });
  });
});

/**
 * Property-Based Tests for Account Deletion
 */
describe('AccountDeletionService - Property Tests', () => {
  let module: TestingModule;
  let service: AccountDeletionService;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        AccountDeletionService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountDeletionService>(AccountDeletionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  /**
   * **Feature: techmate-ai-platform, Property 36: Account deletion timing**
   * **Validates: Requirements 8.5**
   *
   * For any account deletion request, all associated data should be removed
   * from the database within 30 days.
   */
  describe('Property 36: Account deletion timing', () => {
    it('should schedule permanent deletion within 30 days', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
          }),
          async (testData) => {
            const mockUser = {
              id: testData.userId,
              email: testData.email,
              deletedAt: null,
              permanentDeletionAt: null,
            } as User;

            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Mock user exists
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

            // Mock save to capture the updated user
            let savedUser: User | null = null;
            jest.spyOn(userRepository, 'save').mockImplementation((user) => {
              savedUser = user as User;
              return Promise.resolve(user as User);
            });

            // Soft delete the account
            const now = new Date();
            await service.softDeleteAccount(testData.userId);

            // Verify the account was marked for deletion
            expect(savedUser).not.toBeNull();
            expect(savedUser!.deletedAt).toBeDefined();
            expect(savedUser!.permanentDeletionAt).toBeDefined();

            // Verify permanent deletion is scheduled within 30 days
            const deletedAt = savedUser!.deletedAt!;
            const permanentDeletionAt = savedUser!.permanentDeletionAt!;

            const daysDifference =
              (permanentDeletionAt.getTime() - deletedAt.getTime()) /
              (1000 * 60 * 60 * 24);

            // Should be exactly 30 days
            expect(daysDifference).toBeCloseTo(30, 0);

            // Permanent deletion should be in the future
            expect(permanentDeletionAt.getTime()).toBeGreaterThan(now.getTime());

            // Permanent deletion should be within 31 days from now (allowing for timing)
            const maxDeletionTime = new Date(now);
            maxDeletionTime.setDate(maxDeletionTime.getDate() + 31);
            expect(permanentDeletionAt.getTime()).toBeLessThan(
              maxDeletionTime.getTime(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should permanently delete accounts after 30 days', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.uuid(),
              daysAgo: fc.integer({ min: 30, max: 60 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          async (testData) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            // Create expired users
            const expiredUsers = testData.map((data) => {
              const deletionDate = new Date();
              deletionDate.setDate(deletionDate.getDate() - data.daysAgo);

              return {
                id: data.userId,
                email: `${data.userId}@example.com`,
                deletedAt: new Date(
                  deletionDate.getTime() - 30 * 24 * 60 * 60 * 1000,
                ),
                permanentDeletionAt: deletionDate,
              } as User;
            });

            // Mock find to return expired users
            jest.spyOn(userRepository, 'find').mockResolvedValue(expiredUsers);

            // Mock remove
            jest.spyOn(userRepository, 'remove').mockImplementation((user) => {
              return Promise.resolve(user as User);
            });

            // Run permanent deletion
            const deletedCount =
              await service.permanentlyDeleteExpiredAccounts();

            // Verify all expired users were deleted
            expect(deletedCount).toBe(expiredUsers.length);
            expect(userRepository.remove).toHaveBeenCalledTimes(
              expiredUsers.length,
            );

            // Verify each user was removed
            for (const user of expiredUsers) {
              expect(userRepository.remove).toHaveBeenCalledWith(user);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
