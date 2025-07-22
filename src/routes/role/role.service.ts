import { Injectable } from '@nestjs/common'
import {
  RoleAlreadyExistsException,
  RoleIsProtectedException,
  RoleNotFoundException,
} from 'src/routes/role/role.error'
import { CreateRoleBodyType, UpdateRoleBodyType } from 'src/routes/role/role.model'
import { RoleRepo } from 'src/routes/role/role.repo'
import { RoleName } from 'src/shared/constants/role.constant'
import { NotFoundRecordException } from 'src/shared/error'
import { getPagination } from 'src/shared/helper/pagination.helper'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepo: RoleRepo) {}

  /**
   * Kiểm tra xem role có phải là 1 trong 3 role cơ bản không
   */
  private async verifyRole(roleId: number) {
    const role = await this.roleRepo.findById(roleId)
    if (!role) {
      throw NotFoundRecordException
    }
    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller]

    if (baseRoles.includes(role.name)) {
      throw RoleIsProtectedException
    }
  }

  async list({ limit, page }: { limit: number; page: number }) {
    const skip = (page - 1) * limit
    const [roles, totalItems] = await Promise.all([
      this.roleRepo.list({ skip, limit }),
      this.roleRepo.count(),
    ])

    const pagination = getPagination({ totalItems, page, limit })
    return {
      data: roles,
      pagination,
    }
  }

  async findById(id: number) {
    const role = await this.roleRepo.findById(id)
    if (!role) throw RoleNotFoundException
    return role
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number }) {
    try {
      return await this.roleRepo.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw RoleAlreadyExistsException
      throw error
    }
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdateRoleBodyType
    updatedById: number
  }) {
    try {
      await this.verifyRole(id)

      return await this.roleRepo.update({ id, data, updatedById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw RoleAlreadyExistsException
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.verifyRole(id)
      // soft delete
      await this.roleRepo.delete({ id, deletedById })
      return { message: 'Delete successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw RoleNotFoundException
      throw error
    }
  }
}
