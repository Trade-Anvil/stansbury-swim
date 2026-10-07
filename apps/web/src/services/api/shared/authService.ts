import { BaseService, WithConfig } from './baseService'
import { AuthenticationService, SignInDto, SignUpDto, RefreshTokenDto } from '@/api'

@WithConfig()
export class AuthService extends BaseService {
  static async signUp(data: SignUpDto) {
    return AuthenticationService.authenticationControllerSignUp(data)
  }

  static async signIn(data: SignInDto) {
    return AuthenticationService.authenticationControllerSignIn(data)
  }

  static async refreshTokens(data: RefreshTokenDto) {
    return AuthenticationService.authenticationControllerRefreshTokens(data)
  }

  static async logout() {
    return AuthenticationService.authenticationControllerLogout()
  }

  static async forgotPassword(email: string, turnstileToken?: string) {
    return AuthenticationService.authenticationControllerForgotPassword({ email, turnstileToken })
  }

  static async resetPassword(token: string, password: string) {
    return AuthenticationService.authenticationControllerResetPassword({ token, password })
  }

  static async verifyEmail(token: string) {
    return AuthenticationService.authenticationControllerVerifyEmail({ token })
  }

  static async resendVerification() {
    return AuthenticationService.authenticationControllerResendVerification()
  }
}
