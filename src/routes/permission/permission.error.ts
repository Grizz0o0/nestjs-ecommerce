import { UnprocessableEntityException } from '@nestjs/common'

export const PermissionAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.PermissionAlreadyExists',
    path: 'permission',
  },
])

export const PermissionNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.PermissionNotFound',
    path: 'permission',
  },
])
