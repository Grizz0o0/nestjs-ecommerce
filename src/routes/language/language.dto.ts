import { createZodDto } from 'nestjs-zod'
import {
  CreateLanguageBodySchema,
  GetLanguageDetailResSchema,
  GetLanguageParamsSchema,
  GetLanguagesResSchema,
  UpdateLanguageBodySchema,
} from 'src/routes/language/language.model'

export const GetLanguagesResDTO = createZodDto(GetLanguagesResSchema)

export const GetLanguageDetailResDTO = createZodDto(GetLanguageDetailResSchema)

export const GetLanguageParamsDTO = createZodDto(GetLanguageParamsSchema)

export const CreateLanguageBodyDTO = createZodDto(CreateLanguageBodySchema)

export const UpdateLanguageBodyDTO = createZodDto(UpdateLanguageBodySchema)
