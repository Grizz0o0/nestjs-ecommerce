import { Injectable } from '@nestjs/common'
import {
  LanguageAlreadyExistsException,
  LanguageNotFoundException,
} from 'src/routes/language/language.errror'
import { CreateLanguageBodyType, UpdateLanguageBodyType } from 'src/routes/language/language.model'
import { LanguageRepo } from 'src/routes/language/language.repo'
import { NotFoundRecordException } from 'src/shared/error'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'

@Injectable()
export class LanguageService {
  constructor(private readonly languageRepo: LanguageRepo) {}

  async findAll() {
    const languages = await this.languageRepo.findAll()
    if (!languages) return []
    return {
      data: languages,
      totalItems: languages.length,
    }
  }

  async findById(id: string) {
    const language = await this.languageRepo.findById(id)
    if (!language) throw LanguageNotFoundException
    return language
  }

  async create({ data, createdById }: { data: CreateLanguageBodyType; createdById: number }) {
    try {
      return await this.languageRepo.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw LanguageAlreadyExistsException
      throw error
    }
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: string
    data: UpdateLanguageBodyType
    updatedById: number
  }) {
    try {
      return await this.languageRepo.update({ id, data, updatedById })
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }

  async delete({ id, deletedById }: { id: string; deletedById: number }) {
    try {
      // hard delete
      await this.languageRepo.delete({ id, deletedById, isHard: true })
      return { message: 'Delete successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }
}
