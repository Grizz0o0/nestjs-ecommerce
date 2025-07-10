import { Injectable } from '@nestjs/common'
import {
  CreatePermissionBodyType,
  PermissionType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class PermissionRepo {
  constructor(private readonly prismaService: PrismaService) {}

  count(): Promise<number> {
    return this.prismaService.permission.count({ where: { deletedAt: null } })
  }

  list({ skip, limit }: { skip: number; limit: number }): Promise<PermissionType[]> {
    return this.prismaService.permission.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
    })
  }

  findById(id: number): Promise<PermissionType | null> {
    return this.prismaService.permission.findUnique({ where: { id, deletedAt: null } })
  }

  create({
    createdById,
    data,
  }: {
    createdById: number
    data: CreatePermissionBodyType
  }): Promise<PermissionType> {
    return this.prismaService.permission.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  update({
    id,
    updatedById,
    data,
  }: {
    id: number
    updatedById: number
    data: UpdatePermissionBodyType
  }): Promise<PermissionType> {
    return this.prismaService.permission.update({
      where: { id, deletedAt: null },
      data: { ...data, updatedById },
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
  }): Promise<PermissionType> {
    return isHard
      ? this.prismaService.permission.delete({ where: { id } })
      : this.prismaService.permission.update({
          where: { id, deletedAt: null },
          data: { deletedById },
        })
  }
}
