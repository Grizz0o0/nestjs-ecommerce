import { PermissionSchema } from 'src/shared/model/shared-permisssion.model'
import { RoleSchema } from 'src/shared/model/shared-role.model'
import { z } from 'zod'

export const GetRolesQuerySchema = z
  .object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  })
  .strict()

export const GetRoleDetailParamsSchema = z.object({
  roleId: z.coerce.number(),
})

export const GetRoleDetailResSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
})

export const GetRolesResSchema = z.object({
  data: z.array(RoleSchema),
  pagination: z.object({
    totalItems: z.number(),
    totalPages: z.number(),
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
})

export const CreateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
}).strict()

export const UpdateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true,
})
  .extend({
    permissionIds: z.array(z.number()),
  })
  .strict()

export type GetRolesQueryType = z.infer<typeof GetRolesQuerySchema>
export type GetRolesResType = z.infer<typeof GetRolesResSchema>
export type GetRoleDetailParamsType = z.infer<typeof GetRoleDetailParamsSchema>
export type GetRoleDetailResType = z.infer<typeof GetRoleDetailResSchema>
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>
