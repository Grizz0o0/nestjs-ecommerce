import { UnprocessableEntityException } from '@nestjs/common'

export const LanguageAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.LanguageAlreadyExists',
    path: 'language',
  },
])

export const LanguageNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.LanguageNotFound',
    path: 'language',
  },
])
