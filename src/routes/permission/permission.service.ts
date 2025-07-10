import { Injectable } from '@nestjs/common'
import {
  PermissionAlreadyExistsException,
  PermissionNotFoundException,
} from 'src/routes/permission/permission.error'
import {
  CreatePermissionBodyType,
  UpdatePermissionBodyType,
} from 'src/routes/permission/permission.model'
import { PermissionRepo } from 'src/routes/permission/permission.repo'
import { NotFoundRecordException } from 'src/shared/error'
import { getPagination } from 'src/shared/helper/pagination.helper'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepo: PermissionRepo) {}

  async list({ limit, page }: { limit: number; page: number }) {
    const skip = (page - 1) * limit
    const [permissions, totalItems] = await Promise.all([
      this.permissionRepo.list({ skip, limit }),
      this.permissionRepo.count(),
    ])

    const pagination = getPagination({ totalItems, page, limit })
    return {
      data: permissions,
      pagination,
    }
  }

  async findById(id: number) {
    const permission = await this.permissionRepo.findById(id)
    if (!permission) throw PermissionNotFoundException
    return permission
  }

  async create({ data, createdById }: { data: CreatePermissionBodyType; createdById: number }) {
    try {
      return await this.permissionRepo.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw PermissionAlreadyExistsException
      throw error
    }
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePermissionBodyType
    updatedById: number
  }) {
    try {
      return await this.permissionRepo.update({ id, data, updatedById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw PermissionAlreadyExistsException
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      // hard delete
      await this.permissionRepo.delete({ id, deletedById, isHard: true })
      return { message: 'Delete successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }
}
