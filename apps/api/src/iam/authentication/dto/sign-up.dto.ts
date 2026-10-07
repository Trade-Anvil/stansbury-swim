import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123', description: 'User password' })
  @MinLength(10)
  password: string

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string

  @ApiProperty({ example: '(555) 555-5555', description: 'User phone number' })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('US')
  @Transform(params => params.value.replace(/\D/g, ''))
  phoneNumber: string

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile token. Required once TURNSTILE_SECRET_KEY is set.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  turnstileToken?: string
}
