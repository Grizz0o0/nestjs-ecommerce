import { Injectable } from '@nestjs/common'
import {
  CreateLanguageBodyType,
  LanguageType,
  UpdateLanguageBodyType,
} from 'src/routes/language/language.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class LanguageRepo {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<LanguageType[]> {
    return this.prismaService.language.findMany({
      where: { deletedAt: null },
    })
  }

  findById(id: string): Promise<LanguageType | null> {
    return this.prismaService.language.findUnique({ where: { id, deletedAt: null } })
  }

  create({
    createdById,
    data,
  }: {
    createdById: number
    data: CreateLanguageBodyType
  }): Promise<LanguageType> {
    return this.prismaService.language.create({
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
    id: string
    updatedById: number
    data: UpdateLanguageBodyType
  }): Promise<LanguageType> {
    return this.prismaService.language.update({
      where: { id, deletedAt: null },
      data: { name: data.name, updatedById },
    })
  }

  delete({
    id,
    deletedById,
    isHard,
  }: {
    id: string
    deletedById: number
    isHard?: boolean
  }): Promise<LanguageType> {
    return isHard
      ? this.prismaService.language.delete({ where: { id, deletedAt: null } })
      : this.prismaService.language.update({
          where: { id, deletedAt: null },
          data: { deletedById },
        })
  }
}
