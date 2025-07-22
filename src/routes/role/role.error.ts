import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common'

export const RoleAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.RoleAlreadyExists',
    path: 'role',
  },
])

export const RoleNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.RoleNotFound',
    path: 'role',
  },
])

export const RoleIsProtectedException = new ForbiddenException([
  {
    message: 'Error.RoleIsProtected',
    path: 'role',
  },
])
