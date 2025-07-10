import { createZodDto } from 'nestjs-zod'
import {
  CreatePermissionBodySchema,
  GetPermissionDetailResSchema,
  GetPermissionParamsSchema,
  GetPermissionsQuerySchema,
  GetPermissionsResSchema,
  UpdatePermissionBodySchema,
} from 'src/routes/permission/permission.model'

export class GetPermissionsResDTO extends createZodDto(GetPermissionsResSchema) {}

export class GetPermissionDetailResDTO extends createZodDto(GetPermissionDetailResSchema) {}

export class GetPermissionParamsDTO extends createZodDto(GetPermissionParamsSchema) {}

export class GetPermissionQueryDTO extends createZodDto(GetPermissionsQuerySchema) {}

export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}

export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}
