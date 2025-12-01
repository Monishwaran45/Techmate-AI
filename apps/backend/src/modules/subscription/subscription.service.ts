import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Feature gate definitions
export const FEATURE_GATES = {
  // Learning features
  UNLIMITED_ROADMAPS: ['premium', 'enterprise'],
  ADVANCED_EXPLANATIONS: ['premium', 'enterprise'],
  
  // Project features
  UNLIMITED_PROJECTS: ['premium', 'enterprise'],
  GITHUB_EXPORT: ['premium', 'enterprise'],
  
  // Interview features
  UNLIMITED_INTERVIEWS: ['premium', 'enterprise'],
  VOICE_MODE: ['premium', 'enterprise'],
  
  // Job features
  RESUME_OPTIMIZATION: ['premium', 'enterprise'],
  UNLIMITED_JOB_MATCHES: ['premium', 'enterprise'],
  
  // Productivity features
  UNLIMITED_TASKS: ['premium', 'enterprise'],
  NOTE_SUMMARIZATION: ['premium', 'enterprise'],
  
  // Usage limits for free tier (per month)
  FREE_LIMITS: {
    roadmaps: 1,
    projects: 3,
    interviews: 5,
    resumeScans: 2,
    tasks: 50,
    noteSummarizations: 10,
  },
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getSubscription(userId: string): Promise<Subscription> {
    return this.subscriptionRepository.findOne({
      where: { userId },
    });
  }

  async createSubscription(
    userId: string,
    tier: SubscriptionTier = SubscriptionTier.FREE,
  ): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create({
      userId,
      tier,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      usageTracking: {},
    });

    return this.subscriptionRepository.save(subscription);
  }

  async updateSubscriptionTier(
    userId: string,
    tier: SubscriptionTier,
    stripeSubscriptionId?: string,
  ): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);
    
    subscription.tier = tier;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = new Date();
    
    if (tier !== SubscriptionTier.FREE) {
      // Premium subscriptions have 30-day billing period
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscription.endDate = endDate;
    } else {
      subscription.endDate = null;
    }
    
    if (stripeSubscriptionId) {
      subscription.stripeSubscriptionId = stripeSubscriptionId;
    }

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);
    
    subscription.status = SubscriptionStatus.CANCELLED;
    // Keep endDate to maintain access until billing period ends
    
    return this.subscriptionRepository.save(subscription);
  }

  async expireSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);
    
    subscription.status = SubscriptionStatus.EXPIRED;
    subscription.tier = SubscriptionTier.FREE;
    subscription.endDate = null;
    subscription.stripeSubscriptionId = null;
    
    return this.subscriptionRepository.save(subscription);
  }

  async checkFeatureAccess(
    userId: string,
    feature: keyof typeof FEATURE_GATES,
  ): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    
    if (!subscription) {
      return false;
    }

    const allowedTiers = FEATURE_GATES[feature];
    
    if (!Array.isArray(allowedTiers)) {
      return false;
    }

    return allowedTiers.includes(subscription.tier);
  }

  async requireFeatureAccess(
    userId: string,
    feature: keyof typeof FEATURE_GATES,
  ): Promise<void> {
    const hasAccess = await this.checkFeatureAccess(userId, feature);
    
    if (!hasAccess) {
      throw new ForbiddenException({
        message: 'This feature requires a premium subscription',
        feature,
        upgradeRequired: true,
      });
    }
  }

  async trackUsage(
    userId: string,
    feature: string,
    amount: number = 1,
  ): Promise<void> {
    const subscription = await this.getSubscription(userId);
    
    if (!subscription.usageTracking) {
      subscription.usageTracking = {};
    }

    const currentUsage = subscription.usageTracking[feature] || 0;
    subscription.usageTracking[feature] = currentUsage + amount;

    await this.subscriptionRepository.save(subscription);
  }

  async checkUsageLimit(
    userId: string,
    feature: keyof typeof FEATURE_GATES.FREE_LIMITS,
  ): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    
    // Premium users have unlimited usage
    if (subscription.tier !== SubscriptionTier.FREE) {
      return true;
    }

    const limit = FEATURE_GATES.FREE_LIMITS[feature];
    const currentUsage = subscription.usageTracking?.[feature] || 0;

    return currentUsage < limit;
  }

  async requireUsageLimit(
    userId: string,
    feature: keyof typeof FEATURE_GATES.FREE_LIMITS,
  ): Promise<void> {
    const withinLimit = await this.checkUsageLimit(userId, feature);
    
    if (!withinLimit) {
      const subscription = await this.getSubscription(userId);
      const limit = FEATURE_GATES.FREE_LIMITS[feature];
      const currentUsage = subscription.usageTracking?.[feature] || 0;

      throw new ForbiddenException({
        message: `You have reached your monthly limit for ${feature}`,
        feature,
        limit,
        currentUsage,
        upgradeRequired: true,
      });
    }
  }

  async resetMonthlyUsage(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId);
    
    subscription.usageTracking = {};
    
    await this.subscriptionRepository.save(subscription);
  }

  async getUsageStats(userId: string): Promise<{
    tier: SubscriptionTier;
    usage: Record<string, number>;
    limits: typeof FEATURE_GATES.FREE_LIMITS | null;
  }> {
    const subscription = await this.getSubscription(userId);
    
    return {
      tier: subscription.tier as SubscriptionTier,
      usage: subscription.usageTracking || {},
      limits: subscription.tier === SubscriptionTier.FREE 
        ? FEATURE_GATES.FREE_LIMITS 
        : null,
    };
  }
}
