import { createZodDto } from 'nestjs-zod'
import {
  CreateRoleBodySchema,
  GetRoleDetailParamsSchema,
  GetRoleDetailResSchema,
  GetRolesQuerySchema,
  GetRolesResSchema,
  UpdateRoleBodySchema,
} from 'src/routes/role/role.model'

export class GetRolesQueryDTO extends createZodDto(GetRolesQuerySchema) {}

export class GetRolesResDTO extends createZodDto(GetRolesResSchema) {}

export class GetRoleDetailParamsDTO extends createZodDto(GetRoleDetailParamsSchema) {}

export class GetRoleDetailResDTO extends createZodDto(GetRoleDetailResSchema) {}

export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}

export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}
