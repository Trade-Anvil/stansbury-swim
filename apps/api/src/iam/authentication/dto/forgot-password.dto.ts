import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile token. Required once TURNSTILE_SECRET_KEY is set.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  turnstileToken?: string
}
