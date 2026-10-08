import { Role } from '../enums/role.enum'
import { IStudent } from './student'

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  privateRegistration: boolean
  role: Role
  isEmailVerified: boolean
  googleId?: string
  createdAt: Date
  updatedAt: Date
  students: IStudent[]
  unusedCredits: number
  instructorId?: string
}
