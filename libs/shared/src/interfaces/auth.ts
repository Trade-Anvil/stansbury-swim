import { Role } from '../enums/role.enum'
export interface IActiveUserData {
  sub: string
  email: string
  role: string
}

export interface IAuthResponse {
  accessToken: string
  refreshToken: string
  id: string
  role: Role
  name: string
}

export interface ICreditBalance {
  creditType: string
  balance: number
}

export interface ICreditBalanceResponse {
  balances: ICreditBalance[]
}
