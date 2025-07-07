import { z } from 'zod'

export const LanguageSchema = z.object({
  id: z.string().max(10),
  name: z.string().max(500),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const GetLanguagesResSchema = z.object({
  data: z.array(LanguageSchema),
  totalItems: z.number(),
})

export const GetLanguageParamsSchema = z
  .object({
    languageId: z.string().max(10),
  })
  .strict()
export const GetLanguageDetailResSchema = LanguageSchema

export const CreateLanguageBodySchema = z
  .object({
    id: z.string().max(10),
    name: z.string().max(500),
  })
  .strict()
export const CreateLanguageResSchema = LanguageSchema

export const UpdateLanguageBodySchema = LanguageSchema.pick({
  name: true,
}).strict()
export const UpdateLanguageResSchema = LanguageSchema

export type LanguageType = z.infer<typeof LanguageSchema>
export type GetLanguagesResType = z.infer<typeof GetLanguagesResSchema>
export type GetLanguageParamsType = z.infer<typeof GetLanguageParamsSchema>
export type GetLanguageDetailResType = z.infer<typeof GetLanguageDetailResSchema>
export type CreateLanguageBodyType = z.infer<typeof CreateLanguageBodySchema>
export type UpdateLanguageBodyType = z.infer<typeof UpdateLanguageBodySchema>
