import { RoleType } from 'src/shared/model/shared-role.model'
import {
  CreateRoleBodyType,
  GetRoleDetailResType,
  UpdateRoleBodyType,
} from 'src/routes/role/role.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RoleRepo {
  constructor(private readonly prismaService: PrismaService) {}
  count(): Promise<number> {
    return this.prismaService.role.count({ where: { deletedAt: null } })
  }

  list({ skip, limit }: { skip: number; limit: number }): Promise<RoleType[]> {
    return this.prismaService.role.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
    })
  }

  findById(id: number): Promise<GetRoleDetailResType | null> {
    return this.prismaService.role.findUnique({
      where: { id, deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    })
  }

  create({
    data,
    createdById,
  }: {
    data: CreateRoleBodyType
    createdById: number
  }): Promise<RoleType> {
    return this.prismaService.role.create({
      data: { ...data, createdById },
    })
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdateRoleBodyType
    updatedById: number
  }): Promise<RoleType> {
    //Kiểm tra nếu có permissionId nào đã soft delete thì không cho cập nhật
    if (data.permissionIds.length > 0) {
      const permissions = await this.prismaService.permission.findMany({
        where: { id: { in: data.permissionIds } },
      })

      const deletedPermission = permissions.filter((p) => p.deletedAt)
      if (deletedPermission.length > 0) {
        const deletedPermissionIds = deletedPermission.map((p) => p.id).join(', ')
        console.log(`Permission is deleted:::${deletedPermissionIds}`)
        throw new Error(`Permission is deleted:::${deletedPermissionIds}`)
      }
    }

    return this.prismaService.role.update({
      where: { id, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((p) => ({ id: p })),
        },
        updatedById,
      },
      include: { permissions: true },
    })
  }

  delete({
    id,
    deletedById,
    isHard,
  }: {
    id: number
    deletedById: number
    isHard?: boolean
  }): Promise<RoleType> {
    return isHard
      ? this.prismaService.role.delete({ where: { id, deletedAt: null } })
      : this.prismaService.role.update({
          where: { id, deletedAt: null },
          data: { isActive: false, deletedAt: new Date(), deletedById },
        })
  }
}
