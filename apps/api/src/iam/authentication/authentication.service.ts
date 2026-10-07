import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { HashingService } from '../hashing/hashing.service'
import { SignInDto } from './dto/sign-in.dto'
import { SignUpDto } from './dto/sign-up.dto'
import { UserService } from '../../user/user.service'
import { JwtService } from '@nestjs/jwt'
import { ActiveUserData } from './interfaces/active-user-data.interface'
import { User } from '../../user/user'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { Role } from '@lesson-scheduler/shared'
import { EmailService } from '../../email/email.service'
import { randomBytes } from 'crypto'

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name)
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes in milliseconds
  // Minimum gap between reset or confirmation links to one account. Earlier links stay valid in
  // the meantime, so a person who asks twice still has a working email.
  private readonly EMAIL_LINK_COOLDOWN = 5 * 60 * 1000

  constructor(
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; refreshToken: string; id: string; role: Role; name: string }> {
    try {
      // Generate a random salt for each user
      const salt = randomBytes(16).toString('hex')
      const password = await this.hashingService.hash(signUpDto.password + salt)

      const user = await this.userService.signUp(signUpDto, password, salt)
      return await this.generateTokens(user)
    } catch (err: any) {
      if (err instanceof ConflictException) {
        throw new ConflictException('The email address you entered is already in use.')
      }
      this.logger.error(`Failed to sign up user: ${err.message}`, err.stack)
      throw new BadRequestException('Failed to create user account')
    }
  }

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string; id: string; role: Role; name: string }> {
    const user = await this.userService.findOneForAuth(signInDto.email.toLowerCase())
    if (!user) {
      // Use the same error message for security
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check if account is locked
    if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS && user.lastFailedLogin) {
      const lockoutEndTime = new Date(user.lastFailedLogin.getTime() + this.LOCKOUT_TIME)
      if (new Date() < lockoutEndTime) {
        throw new UnauthorizedException('Account is temporarily locked. Please try again later.')
      }
      // Reset counter if lockout period has passed
      await this.userService.resetLoginAttempts(user.id)
    }

    if (!user.password || !user.salt) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Add salt to the provided password before comparing
    const isEqual = await this.hashingService.compare(signInDto.password + user.salt, user.password)

    if (!isEqual) {
      // Increment failed attempts
      await this.userService.incrementFailedAttempts(user.id)
      throw new UnauthorizedException('Invalid credentials')
    }

    // Reset failed attempts on successful login
    await this.userService.resetLoginAttempts(user.id)

    return await this.generateTokens(user)
  }

  async generateTokens(
    user: User,
    impersonatorId?: string,
  ): Promise<{ accessToken: string; refreshToken: string; id: string; role: Role; name: string }> {
    try {
      const accessTokenPayload: Partial<ActiveUserData> = {
        email: user.email,
        role: user.role,
      }
      if (impersonatorId) {
        accessTokenPayload.impersonatorId = impersonatorId
      }
      const [accessToken, refreshToken] = await Promise.all([
        this.signToken<Partial<ActiveUserData>>(
          user.id,
          accessTokenPayload,
          '14d', // Changed from 15m to 7d
        ),
        this.signToken(user.id, {}, '14d'), // Longer-lived refresh token
      ])
      return {
        accessToken,
        refreshToken,
        id: user.id,
        role: user.role,
        name: user.firstName,
      }
    } catch (err: any) {
      this.logger.error(`Failed to generate tokens: ${err.message}`, err.stack)
      throw new UnauthorizedException('Failed to generate authentication tokens')
    }
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync<Pick<ActiveUserData, 'sub'>>(refreshTokenDto.refreshToken)
      const user = await this.userService.findOne(sub)

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      return this.generateTokens(user)
    } catch (err: any) {
      this.logger.error(`Failed to refresh tokens: ${err.message}`, err.stack)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.userService.findOneForAuth(email.toLowerCase())
      if (!user) {
        // Don't reveal whether the email exists
        return
      }
      if (!(await this.userService.claimPasswordResetSlot(user.id, this.EMAIL_LINK_COOLDOWN))) {
        // Same response as a send, so the cooldown doesn't reveal that the account exists either.
        this.logger.warn(`Skipped password reset for user ${user.id}: requested again inside the cooldown`)
        return
      }
      await this.emailService.sendResetPasswordLink(email)
    } catch (err: any) {
      this.logger.error(`Failed to process forgot password: ${err.message}`, err.stack)
      // Don't reveal whether the email exists
      return
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const email = await this.emailService.decodeConfirmationToken(token)
      const user = await this.userService.findOneForAuth(email.toLowerCase())

      if (!user) {
        throw new UnauthorizedException('Invalid or expired reset token')
      }

      if (user.resetToken !== token) {
        throw new UnauthorizedException('Invalid or expired reset token')
      }

      // Generate new salt and hash password with it
      const salt = randomBytes(16).toString('hex')
      const hashedPassword = await this.hashingService.hash(password + salt)

      await this.userService.updatePassword(user, hashedPassword, salt)
    } catch (err: any) {
      this.logger.error(`Failed to reset password: ${err.message}`, err.stack)
      throw new UnauthorizedException('Invalid or expired reset token')
    }
  }

  /**
   * Redeems a verification link. The token is decoded first so an expired link fails with a
   * clear reason, then matched against the copy stored on the account so it burns after one use.
   */
  async verifyEmail(token: string): Promise<User> {
    await this.emailService.decodeConfirmationToken(token)
    return this.userService.confirmEmailVerification(token)
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (user.emailVerified && !user.pendingEmail) {
      throw new BadRequestException('Email address is already confirmed')
    }
    if (!(await this.userService.claimVerificationEmailSlot(user.id, this.EMAIL_LINK_COOLDOWN))) {
      // A link went out a few minutes ago and still works. Report success so the banner reads
      // "sent" instead of failing, without mailing the address again.
      this.logger.warn(`Skipped verification resend for user ${user.id}: requested again inside the cooldown`)
      return
    }
    await this.emailService.sendVerifyEmailLink(user, user.pendingEmail ?? user.email)
  }

  async impersonate(
    userId: string,
    adminUser: ActiveUserData,
  ): Promise<{ accessToken: string; refreshToken: string; id: string; role: Role; name: string }> {
    const userToImpersonate = await this.userService.findOne(userId)
    if (!userToImpersonate) {
      throw new NotFoundException('User not found')
    }
    return this.generateTokens(userToImpersonate, adminUser.sub)
  }

  async exitImpersonation(activeUser: ActiveUserData) {
    if (!activeUser.impersonatorId) {
      throw new BadRequestException('Not impersonating a user')
    }

    const adminUser = await this.userService.findOne(activeUser.impersonatorId)
    if (!adminUser) {
      throw new NotFoundException('Admin user not found')
    }

    return this.generateTokens(adminUser)
  }

  private async signToken<T>(userId: string, payload?: T, expiresIn?: string) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        expiresIn: expiresIn || '15m', // Default to 15 minutes
      },
    )
  }
}
