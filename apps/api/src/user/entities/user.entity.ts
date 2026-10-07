import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'
import { Role } from '@lesson-scheduler/shared'

@Schema({
  collection: 'users',
  timestamps: true,
})
export class UserEntity {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  @Prop({ type: String, required: false, select: false })
  password?: string
  @Prop({ required: false })
  googleId?: string
  @Prop({ required: false })
  firstName: string
  @Prop({ required: false })
  lastName: string
  @Prop({ required: false })
  email: string
  @Prop({ required: false })
  address1: string
  @Prop({ required: false })
  address2: string
  @Prop({ required: false })
  city: string
  @Prop({ required: false })
  state: string
  @Prop({ required: false })
  zip: string
  @Prop({ required: false })
  phone: string
  @Prop({ required: true, default: false })
  privateRegistration: boolean

  @Prop({ required: true, type: String, enum: Role, default: Role.User })
  role: Role

  @Prop({ required: false })
  resetToken: string

  // When the last reset link went out. Requests inside the cooldown are dropped so the
  // forgot-password form can't be used to flood someone's inbox.
  @Prop({ required: false })
  resetRequestedAt?: Date

  // Same idea for the confirm-your-address link. Stamped at sign-up and on each resend.
  @Prop({ required: false })
  verificationEmailSentAt?: Date

  // Absent means verified. Accounts that predate email verification are grandfathered in
  // rather than backfilled, so only sign-ups from here on start out unverified.
  @Prop({ required: false })
  emailVerified?: boolean

  // An address the user has asked to change to but has not confirmed yet. The live `email`
  // does not move until they click the link, so a typo can never strand the account.
  @Prop({ required: false })
  pendingEmail?: string

  @Prop({ required: false })
  emailVerificationToken?: string

  @Prop({ default: 0 })
  failedLoginAttempts: number

  @Prop()
  lastFailedLogin: Date

  @Prop({ required: false })
  salt: string

  @Prop({ required: true, default: false })
  signedWaiver: boolean

  @Prop({ required: false })
  waiverSignature: string

  @Prop({ required: false })
  waiverSignatureDate: Date

  @Prop({ required: false })
  instructorId: string
}

export const UserSchema = SchemaFactory.createForClass(UserEntity)
