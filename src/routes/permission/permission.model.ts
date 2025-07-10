import { HTTPMethod } from 'src/shared/constants/permission.constant'
import { z } from 'zod'

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  path: z.string(),
  method: z.nativeEnum(HTTPMethod),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const GetPermissionsQuerySchema = z
  .object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  })
  .strict()

export const GetPermissionsResSchema = z.object({
  data: z.array(PermissionSchema),
  pagination: z.object({
    totalItems: z.number(),
    totalPages: z.number(),
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
})

export const GetPermissionParamsSchema = z
  .object({
    permissionId: z.coerce.number(),
  })
  .strict()
export const GetPermissionDetailResSchema = PermissionSchema

export const CreatePermissionBodySchema = PermissionSchema.pick({
  name: true,
  description: true,
  path: true,
  method: true,
}).strict()

export const UpdatePermissionBodySchema = CreatePermissionBodySchema

export type PermissionType = z.infer<typeof PermissionSchema>
export type GetPermissionsResType = z.infer<typeof GetPermissionsResSchema>
export type GetPermissionsQueryType = z.infer<typeof GetPermissionsQuerySchema>
export type GetPermissionParamsType = z.infer<typeof GetPermissionParamsSchema>
export type GetPermissionDetailResType = z.infer<typeof GetPermissionDetailResSchema>
export type CreatePermissionBodyType = z.infer<typeof CreatePermissionBodySchema>
export type UpdatePermissionBodyType = z.infer<typeof UpdatePermissionBodySchema>
