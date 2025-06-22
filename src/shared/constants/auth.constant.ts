export const REQUEST_USER_KEY = 'user'
export const AUTH_TYPE_KEY = 'auth'

export const AuthType = {
  Bearer: 'Bearer',
  None: 'None',
  ApiKey: 'ApiKey',
} as const

export type AuthTypeValue = (typeof AuthType)[keyof typeof AuthType]

export const ConditionGuard = {
  And: 'and',
  Or: 'or',
} as const

export type ConditionGuardValue = (typeof ConditionGuard)[keyof typeof ConditionGuard]
