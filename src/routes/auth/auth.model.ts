import { TypeOfValidationCode } from 'src/shared/constants/auth.constant'
import { UserSchema } from 'src/shared/model/shared-user.model'
import { z } from 'zod'

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNumber: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
    code: z.string().length(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu và mật khẩu xác nhận phải giống nhau',
        path: ['confirmPassword'],
      })
    }
  })

export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
}).strict()

export const ValidationCode = z.object({
  id: z.number(),
  email: z.string().email(),
  code: z.string().length(6),
  type: z.nativeEnum(TypeOfValidationCode),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const SendOTPBodySchema = z
  .object({
    email: z.string().email(),
    type: z.nativeEnum(TypeOfValidationCode),
  })
  .strict()

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
})
  .extend({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    if (totpCode !== undefined && code !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Bạn chỉ nên truyền mã xác thực 2FA hoặc mã OTP. Không được truyền cả 2',
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: 'custom',
        message: 'Bạn chỉ nên truyền mã xác thực 2FA hoặc mã OTP. Không được truyền cả 2',
        path: ['code'],
      })
    }
  })

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean(),
})

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict()

export const RefreshTokenResSchema = LoginResSchema

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const LogoutBodySchema = RefreshTokenBodySchema

export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true,
})

export const GetAuthorizationUrlResSchema = z.object({
  url: z.string().url(),
})

export const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu và mật khẩu xác nhận phải giống nhau',
        path: ['confirmNewPassword'],
      })
    }
  })

export const DisableTwoFactorAuthBodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    // Khi cung cấp cả totpCode và code, hoặc không cung cấp cả totpCode và code
    if ((totpCode !== undefined) === (code !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Bạn phải cung cấp mã xác thực 2FA hoặc mã OTP. Không được cung cấp cả 2',
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: 'custom',
        message: 'Bạn phải cung cấp mã xác thực 2FA hoặc mã OTP. Không được cung cấp cả 2',
        path: ['code'],
      })
    }
  })

export const TwoFactorSetupResSchema = z.object({
  secret: z.string(),
  uri: z.string(),
})

export type RoleType = z.infer<typeof RoleSchema>
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type RegisterResType = z.infer<typeof RegisterResSchema>
export type ValidationCodeType = z.infer<typeof ValidationCode>
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResType = z.infer<typeof LoginResSchema>
export type DeviceType = z.infer<typeof DeviceSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type RefreshTokenResType = LoginResType
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>
export type LogoutBodyType = RefreshTokenBodyType
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>
export type GetAuthorizationUrlResType = z.infer<typeof GetAuthorizationUrlResSchema>
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type DisableTwoFactorAuthBodyType = z.infer<typeof DisableTwoFactorAuthBodySchema>
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>
