import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { ForbiddenException } from '@nestjs/common';
import { SubscriptionService, SubscriptionTier } from './subscription.service';
import { Subscription } from '../../entities/subscription.entity';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Subscription Operations', () => {
    it('should create a free subscription by default', async () => {
      const userId = 'test-user-id';
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.FREE,
        status: 'active',
        startDate: new Date(),
        usageTracking: {},
      };

      mockSubscriptionRepository.create.mockReturnValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.createSubscription(userId);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.status).toBe('active');
    });

    it('should update subscription tier', async () => {
      const userId = 'test-user-id';
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.FREE,
        status: 'active',
        startDate: new Date(),
        usageTracking: {},
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.PREMIUM,
      });

      const result = await service.updateSubscriptionTier(
        userId,
        SubscriptionTier.PREMIUM,
      );

      expect(result.tier).toBe(SubscriptionTier.PREMIUM);
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 41: Free-tier upgrade prompts**
   * **Validates: Requirements 10.1**
   * 
   * For any free-tier user attempting to access premium features, an upgrade prompt
   * should be displayed (ForbiddenException with upgradeRequired flag).
   */
  describe('Property 41: Free-tier upgrade prompts', () => {
    it('should prompt upgrade for any free-tier user accessing premium features', async () => {
      // Generator for premium features
      const premiumFeatureArbitrary = fc.constantFrom(
        'UNLIMITED_ROADMAPS',
        'ADVANCED_EXPLANATIONS',
        'UNLIMITED_PROJECTS',
        'GITHUB_EXPORT',
        'UNLIMITED_INTERVIEWS',
        'VOICE_MODE',
        'RESUME_OPTIMIZATION',
        'UNLIMITED_JOB_MATCHES',
        'UNLIMITED_TASKS',
        'NOTE_SUMMARIZATION'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            feature: premiumFeatureArbitrary,
          }),
          async ({ userId, feature }) => {
            // Setup free-tier subscription
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier: SubscriptionTier.FREE,
              status: 'active',
              startDate: new Date(),
              usageTracking: {},
            } as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Attempt to access premium feature should throw ForbiddenException
            await expect(
              service.requireFeatureAccess(userId, feature as any)
            ).rejects.toThrow(ForbiddenException);

            // Verify the exception contains upgrade prompt information
            try {
              await service.requireFeatureAccess(userId, feature as any);
            } catch (error) {
              expect(error).toBeInstanceOf(ForbiddenException);
              if (error instanceof ForbiddenException) {
                const response = error.getResponse() as any;
                expect(response.upgradeRequired).toBe(true);
                expect(response.feature).toBe(feature);
                expect(response.message).toContain('premium subscription');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow premium users to access premium features without prompts', async () => {
      const premiumFeatureArbitrary = fc.constantFrom(
        'UNLIMITED_ROADMAPS',
        'ADVANCED_EXPLANATIONS',
        'UNLIMITED_PROJECTS',
        'GITHUB_EXPORT',
        'UNLIMITED_INTERVIEWS',
        'VOICE_MODE',
        'RESUME_OPTIMIZATION',
        'UNLIMITED_JOB_MATCHES',
        'UNLIMITED_TASKS',
        'NOTE_SUMMARIZATION'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            feature: premiumFeatureArbitrary,
            tier: fc.constantFrom(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
          }),
          async ({ userId, feature, tier }) => {
            // Setup premium subscription
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier,
              status: 'active',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              usageTracking: {},
            } as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Should not throw - premium users have access
            await expect(
              service.requireFeatureAccess(userId, feature as any)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Usage Tracking', () => {
    it('should track usage for features', async () => {
      const userId = 'test-user-id';
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.FREE,
        status: 'active',
        startDate: new Date(),
        usageTracking: {},
      } as Subscription;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        usageTracking: { roadmaps: 1 },
      });

      await service.trackUsage(userId, 'roadmaps', 1);

      expect(mockSubscriptionRepository.save).toHaveBeenCalled();
    });

    it('should enforce usage limits for free tier', async () => {
      const userId = 'test-user-id';
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.FREE,
        status: 'active' as const,
        startDate: new Date(),
        usageTracking: { roadmaps: 1 }, // At limit
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Subscription;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      // Should throw when at limit
      await expect(
        service.requireUsageLimit(userId, 'roadmaps')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not enforce limits for premium users', async () => {
      const userId = 'test-user-id';
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.PREMIUM,
        status: 'active' as const,
        startDate: new Date(),
        usageTracking: { roadmaps: 100 }, // Way over free limit
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Subscription;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      // Should not throw for premium users
      const result = await service.checkUsageLimit(userId, 'roadmaps');
      expect(result).toBe(true);
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 42: Immediate premium access after subscription**
   * **Validates: Requirements 10.2**
   * 
   * For any successful premium subscription, all premium features should be immediately accessible.
   */
  describe('Property 42: Immediate premium access after subscription', () => {
    it('should grant immediate access to all premium features after subscription', async () => {
      const premiumFeatureArbitrary = fc.constantFrom(
        'UNLIMITED_ROADMAPS',
        'ADVANCED_EXPLANATIONS',
        'UNLIMITED_PROJECTS',
        'GITHUB_EXPORT',
        'UNLIMITED_INTERVIEWS',
        'VOICE_MODE',
        'RESUME_OPTIMIZATION',
        'UNLIMITED_JOB_MATCHES',
        'UNLIMITED_TASKS',
        'NOTE_SUMMARIZATION'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            tier: fc.constantFrom(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
            feature: premiumFeatureArbitrary,
          }),
          async ({ userId, tier, feature }) => {
            // Simulate subscription upgrade
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier,
              status: 'active' as const,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              usageTracking: {},
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Immediately after subscription, user should have access
            const hasAccess = await service.checkFeatureAccess(userId, feature as any);
            expect(hasAccess).toBe(true);

            // Should not throw when requiring access
            await expect(
              service.requireFeatureAccess(userId, feature as any)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant unlimited usage immediately after subscription', async () => {
      const usageLimitFeatureArbitrary = fc.constantFrom(
        'roadmaps',
        'projects',
        'interviews',
        'resumeScans',
        'tasks',
        'noteSummarizations'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            tier: fc.constantFrom(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
            feature: usageLimitFeatureArbitrary,
            currentUsage: fc.integer({ min: 0, max: 1000 }),
          }),
          async ({ userId, tier, feature, currentUsage }) => {
            // Simulate subscription with high usage
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier,
              status: 'active' as const,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              usageTracking: { [feature]: currentUsage },
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Premium users should have unlimited usage regardless of current usage
            const withinLimit = await service.checkUsageLimit(userId, feature as any);
            expect(withinLimit).toBe(true);

            // Should not throw when requiring usage limit
            await expect(
              service.requireUsageLimit(userId, feature as any)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 43: Subscription expiry reversion**
   * **Validates: Requirements 10.3**
   * 
   * For any expired subscription, the user should be reverted to free-tier access within 24 hours.
   */
  describe('Property 43: Subscription expiry reversion', () => {
    it('should revert any expired subscription to free tier', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            tier: fc.constantFrom(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
            daysExpired: fc.integer({ min: 1, max: 30 }),
          }),
          async ({ userId, tier, daysExpired }) => {
            // Create expired subscription
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - daysExpired);

            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier,
              status: 'active' as const,
              startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
              endDate: expiredDate,
              stripeSubscriptionId: 'sub_123',
              usageTracking: {},
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            mockSubscriptionRepository.save.mockResolvedValue({
              ...mockSubscription,
              tier: SubscriptionTier.FREE,
              status: 'expired',
              endDate: null,
              stripeSubscriptionId: null,
            });

            // Expire the subscription
            const result = await service.expireSubscription(userId);

            // Verify reversion to free tier
            expect(result.tier).toBe(SubscriptionTier.FREE);
            expect(result.status).toBe('expired');
            expect(result.endDate).toBeNull();
            expect(result.stripeSubscriptionId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove premium feature access after expiry', async () => {
      const premiumFeatureArbitrary = fc.constantFrom(
        'UNLIMITED_ROADMAPS',
        'ADVANCED_EXPLANATIONS',
        'UNLIMITED_PROJECTS',
        'GITHUB_EXPORT',
        'UNLIMITED_INTERVIEWS',
        'VOICE_MODE',
        'RESUME_OPTIMIZATION',
        'UNLIMITED_JOB_MATCHES',
        'UNLIMITED_TASKS',
        'NOTE_SUMMARIZATION'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            feature: premiumFeatureArbitrary,
          }),
          async ({ userId, feature }) => {
            // Create expired subscription that has been reverted to free
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier: SubscriptionTier.FREE,
              status: 'expired' as const,
              startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              endDate: null,
              usageTracking: {},
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Should not have access to premium features
            const hasAccess = await service.checkFeatureAccess(userId, feature as any);
            expect(hasAccess).toBe(false);

            // Should throw when requiring access
            await expect(
              service.requireFeatureAccess(userId, feature as any)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 44: Cancellation grace period**
   * **Validates: Requirements 10.4**
   * 
   * For any subscription cancellation, premium access should remain until the end of the current billing period.
   */
  describe('Property 44: Cancellation grace period', () => {
    it('should maintain access until end of billing period after cancellation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            tier: fc.constantFrom(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
            daysRemaining: fc.integer({ min: 1, max: 30 }),
          }),
          async ({ userId, tier, daysRemaining }) => {
            // Create active subscription with remaining days
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + daysRemaining);

            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier,
              status: 'active' as const,
              startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
              endDate,
              usageTracking: {},
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            mockSubscriptionRepository.save.mockResolvedValue({
              ...mockSubscription,
              status: 'cancelled',
            });

            // Cancel subscription
            const result = await service.cancelSubscription(userId);

            // Verify status is cancelled but endDate is preserved
            expect(result.status).toBe('cancelled');
            expect(result.endDate).toEqual(endDate);
            expect(result.tier).toBe(tier); // Tier should remain unchanged
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow premium feature access during grace period', async () => {
      const premiumFeatureArbitrary = fc.constantFrom(
        'UNLIMITED_ROADMAPS',
        'ADVANCED_EXPLANATIONS',
        'UNLIMITED_PROJECTS',
        'GITHUB_EXPORT',
        'UNLIMITED_INTERVIEWS',
        'VOICE_MODE',
        'RESUME_OPTIMIZATION',
        'UNLIMITED_JOB_MATCHES',
        'UNLIMITED_TASKS',
        'NOTE_SUMMARIZATION'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            tier: fc.constantFrom(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
            feature: premiumFeatureArbitrary,
            daysRemaining: fc.integer({ min: 1, max: 30 }),
          }),
          async ({ userId, tier, feature, daysRemaining }) => {
            // Create cancelled subscription still within billing period
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + daysRemaining);

            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier,
              status: 'cancelled' as const,
              startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              endDate,
              usageTracking: {},
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Should still have access during grace period
            const hasAccess = await service.checkFeatureAccess(userId, feature as any);
            expect(hasAccess).toBe(true);

            // Should not throw when requiring access
            await expect(
              service.requireFeatureAccess(userId, feature as any)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 45: Usage limit enforcement**
   * **Validates: Requirements 10.5**
   * 
   * For any free-tier feature with usage limits, the system should track usage and prevent access when limits are exceeded.
   */
  describe('Property 45: Usage limit enforcement', () => {
    it('should enforce usage limits for all free-tier features', async () => {
      const usageLimitFeatureArbitrary = fc.constantFrom(
        'roadmaps',
        'projects',
        'interviews',
        'resumeScans',
        'tasks',
        'noteSummarizations'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            feature: usageLimitFeatureArbitrary,
          }),
          async ({ userId, feature }) => {
            // Get the limit for this feature
            const limits = {
              roadmaps: 1,
              projects: 3,
              interviews: 5,
              resumeScans: 2,
              tasks: 50,
              noteSummarizations: 10,
            };
            const limit = limits[feature as keyof typeof limits];

            // Create subscription at limit
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier: SubscriptionTier.FREE,
              status: 'active' as const,
              startDate: new Date(),
              usageTracking: { [feature]: limit },
              createdAt: new Date(),
              updatedAt: new Date(),
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Should not be within limit
            const withinLimit = await service.checkUsageLimit(userId, feature as any);
            expect(withinLimit).toBe(false);

            // Should throw when requiring usage limit
            await expect(
              service.requireUsageLimit(userId, feature as any)
            ).rejects.toThrow(ForbiddenException);

            // Verify exception contains limit information
            try {
              await service.requireUsageLimit(userId, feature as any);
            } catch (error) {
              if (error instanceof ForbiddenException) {
                const response = error.getResponse() as any;
                expect(response.upgradeRequired).toBe(true);
                expect(response.feature).toBe(feature);
                expect(response.limit).toBe(limit);
                expect(response.currentUsage).toBe(limit);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow usage below limits', async () => {
      const usageLimitFeatureArbitrary = fc.constantFrom(
        'roadmaps',
        'projects',
        'interviews',
        'resumeScans',
        'tasks',
        'noteSummarizations'
      );

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            feature: usageLimitFeatureArbitrary,
          }),
          async ({ userId, feature }) => {
            // Get the limit for this feature
            const limits = {
              roadmaps: 1,
              projects: 3,
              interviews: 5,
              resumeScans: 2,
              tasks: 50,
              noteSummarizations: 10,
            };
            const limit = limits[feature as keyof typeof limits];
            const currentUsage = Math.max(0, limit - 1); // Below limit

            // Create subscription below limit
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier: SubscriptionTier.FREE,
              status: 'active' as const,
              startDate: new Date(),
              usageTracking: { [feature]: currentUsage },
              createdAt: new Date(),
              updatedAt: new Date(),
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

            // Should be within limit
            const withinLimit = await service.checkUsageLimit(userId, feature as any);
            expect(withinLimit).toBe(true);

            // Should not throw when requiring usage limit
            await expect(
              service.requireUsageLimit(userId, feature as any)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track usage increments correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            feature: fc.string({ minLength: 1, maxLength: 50 }),
            initialUsage: fc.integer({ min: 0, max: 100 }),
            increment: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ userId, feature, initialUsage, increment }) => {
            const mockSubscription = {
              id: 'sub-id',
              userId,
              tier: SubscriptionTier.FREE,
              status: 'active' as const,
              startDate: new Date(),
              usageTracking: { [feature]: initialUsage },
              createdAt: new Date(),
              updatedAt: new Date(),
            } as unknown as Subscription;

            mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
            
            let savedUsage = initialUsage;
            mockSubscriptionRepository.save.mockImplementation(async (sub: any) => {
              savedUsage = sub.usageTracking[feature];
              return sub;
            });

            // Track usage
            await service.trackUsage(userId, feature, increment);

            // Verify the save was called
            expect(mockSubscriptionRepository.save).toHaveBeenCalled();
            
            // Verify usage was incremented correctly
            expect(savedUsage).toBe(initialUsage + increment);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Subscription Lifecycle', () => {
    it('should cancel subscription while maintaining access until end date', async () => {
      const userId = 'test-user-id';
      const endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.PREMIUM,
        status: 'active',
        startDate: new Date(),
        endDate,
        usageTracking: {},
      } as Subscription;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: 'cancelled',
      });

      const result = await service.cancelSubscription(userId);

      expect(result.status).toBe('cancelled');
      expect(result.endDate).toEqual(endDate); // End date preserved
    });

    it('should expire subscription and revert to free tier', async () => {
      const userId = 'test-user-id';
      const mockSubscription = {
        id: 'sub-id',
        userId,
        tier: SubscriptionTier.PREMIUM,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() - 1000), // Expired
        stripeSubscriptionId: 'sub_123',
        usageTracking: {},
      } as Subscription;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.FREE,
        status: 'expired',
        endDate: null,
        stripeSubscriptionId: null,
      });

      const result = await service.expireSubscription(userId);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.status).toBe('expired');
      expect(result.endDate).toBeNull();
      expect(result.stripeSubscriptionId).toBeNull();
    });
  });
});
