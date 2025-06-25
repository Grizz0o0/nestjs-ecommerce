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
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      })
    }
  })
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>

export const RegisterResSchema = UserSchema.omit({
  password: true,
  totpSecret: true,
}).strict()
export type RegisterResType = z.infer<typeof RegisterResSchema>

export const ValidationCode = z.object({
  id: z.number(),
  email: z.string().email(),
  code: z.string().length(6),
  type: z.nativeEnum(TypeOfValidationCode),
  expiresAt: z.date(),
  createdAt: z.date(),
})
export type ValidationCodeType = z.infer<typeof ValidationCode>

export const SendOTPBodySchema = z
  .object({
    email: z.string().email(),
    type: z.nativeEnum(TypeOfValidationCode),
  })
  .strict()
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>

export const SendOTPResSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  code: z.string(),
  type: z.nativeEnum(TypeOfValidationCode),
  expiresAt: z.date(),
  createdAt: z.date(),
})
export type SendOTPResType = z.infer<typeof SendOTPResSchema>
