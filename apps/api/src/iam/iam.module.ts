import { Module } from '@nestjs/common'
import { HashingService } from './hashing/hashing.service'
import { BcryptService } from './hashing/bcrypt.service'
import { AuthenticationController } from './authentication/authentication.controller'
import { AuthenticationService } from './authentication/authentication.service'
import { UserModule } from '../user/user.module'
import jwtConfig from './config/jwt.config'

import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AccessTokenGuard } from './authentication/guards/access-token.guard'
import { AuthenticationGuard } from './authentication/guards/authentication.guard'
import { RolesGuard } from './authentication/guards/roles.guard'
import { GoogleAuthenticationService } from './authentication/social/google-authentication.service'
import { GoogleAuthenticationController } from './authentication/social/google-authentication.controller'
import { EmailModule } from '../email/email.module'
import { ConfigEnum } from '../shared/config.enum'
import { TurnstileService } from './authentication/turnstile.service'

@Module({
  imports: [
    UserModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(ConfigEnum.JwtAccessTokenSecret),
        signOptions: {
          expiresIn: configService.get(ConfigEnum.JwtAccessTokenExpirationTime),
        },
        audience: configService.get(ConfigEnum.JwtAccessTokenAudience),
      }),
    }),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    BcryptService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    AuthenticationService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AccessTokenGuard,
    GoogleAuthenticationService,
    TurnstileService,
  ],
  controllers: [AuthenticationController, GoogleAuthenticationController],
})
export class IamModule {}
