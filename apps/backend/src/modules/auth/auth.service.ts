import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { User, UserProfile, Subscription } from '../../entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private jwtService: JwtService
  ) {}

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   */
  async comparePasswords(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      role: registerDto.role,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
    const profile = this.profileRepository.create({
      userId: savedUser.id,
      name: registerDto.name,
      skills: [],
      goals: [],
      experience: 'beginner',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
    });

    await this.profileRepository.save(profile);

    // Create free subscription
    const subscription = this.subscriptionRepository.create({
      userId: savedUser.id,
      tier: 'free',
      status: 'active',
      startDate: new Date(),
    });

    await this.subscriptionRepository.save(subscription);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      },
      ...tokens,
    };
  }

  /**
   * Login a user
   */
  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return a temporary token that requires 2FA verification
      return {
        requiresTwoFactor: true,
        tempToken: await this.generateTempToken(user.id),
      };
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Generate JWT access and refresh tokens
   */
  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  /**
   * Generate a temporary token for 2FA flow
   */
  async generateTempToken(userId: string): Promise<string> {
    return this.jwtService.sign(
      { sub: userId, temp: true },
      { expiresIn: '5m' } // 5 minutes for 2FA verification
    );
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'subscription'],
    });
  }

  /**
   * Enable two-factor authentication for a user
   */
  async enable2FA(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate OTP auth URL
    const otpauthUrl = authenticator.keyuri(user.email, 'TechMate AI', secret);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Save secret (but don't enable yet - user must verify first)
    user.twoFactorSecret = secret;
    await this.userRepository.save(user);

    return {
      secret,
      qrCode,
    };
  }

  /**
   * Verify 2FA token and enable 2FA
   */
  async verify2FASetup(userId: string, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA setup not initiated');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await this.userRepository.save(user);

    return { success: true, message: '2FA enabled successfully' };
  }

  /**
   * Verify 2FA token during login
   */
  async verify2FALogin(tempToken: string, token: string) {
    try {
      const payload = this.jwtService.verify(tempToken);

      if (!payload.temp) {
        throw new UnauthorizedException('Invalid temporary token');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new UnauthorizedException('2FA not enabled for this user');
      }

      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA token');
      }

      // Generate regular tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(userId: string, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not enabled');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await this.userRepository.save(user);

    return { success: true, message: '2FA disabled successfully' };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<UserProfile>) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    // Update fields
    if (updateData.name !== undefined) profile.name = updateData.name;
    if (updateData.avatar !== undefined) profile.avatar = updateData.avatar;
    if (updateData.skills !== undefined) profile.skills = updateData.skills;
    if (updateData.goals !== undefined) profile.goals = updateData.goals;
    if (updateData.experience !== undefined) profile.experience = updateData.experience;
    if (updateData.preferences !== undefined) {
      profile.preferences = {
        ...profile.preferences,
        ...updateData.preferences,
      };
    }

    return this.profileRepository.save(profile);
  }

  /**
   * Soft delete user account with 30-day retention
   */
  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.deletedAt) {
      throw new ConflictException('Account already marked for deletion');
    }

    const now = new Date();
    const permanentDeletionDate = new Date(now);
    permanentDeletionDate.setDate(permanentDeletionDate.getDate() + 30);

    user.deletedAt = now;
    user.permanentDeletionAt = permanentDeletionDate;

    await this.userRepository.save(user);

    return {
      message: 'Account marked for deletion',
      deletedAt: now,
      permanentDeletionAt: permanentDeletionDate,
    };
  }

  /**
   * Cancel account deletion
   */
  async cancelDeletion(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.deletedAt) {
      throw new ConflictException('Account is not marked for deletion');
    }

    user.deletedAt = null;
    user.permanentDeletionAt = null;

    await this.userRepository.save(user);

    return {
      message: 'Account deletion cancelled',
    };
  }
}
