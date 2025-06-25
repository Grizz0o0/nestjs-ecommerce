import { Injectable } from '@nestjs/common'
import { UserType } from 'src/shared/model/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async finUnique(uniqueObject: { email: string } | { id: number }): Promise<UserType | null> {
    return this.prismaService.user.findUnique({ where: uniqueObject })
  }
}
