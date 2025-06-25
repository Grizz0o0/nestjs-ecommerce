import { Injectable } from '@nestjs/common'
import { RegisterBodyType, ValidationCodeType } from 'src/routes/auth/auth.model'
import { TypeOfValidationCodeType } from 'src/shared/constants/auth.constant'
import { UserType } from 'src/shared/model/shared-user.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  async createValidationCode(
    payload: Pick<ValidationCodeType, 'email' | 'code' | 'type' | 'expiresAt'>,
  ): Promise<ValidationCodeType> {
    return this.prismaService.verificationCode.upsert({
      where: {
        email: payload.email,
      },
      create: payload,
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
    })
  }

  async findUniqueValidationCode(
    uniqueValue: { email: string } | { id: number } | { email: string; code: string; type: TypeOfValidationCodeType },
  ): Promise<ValidationCodeType | null> {
    return this.prismaService.verificationCode.findUnique({
      where: uniqueValue,
    })
  }
}
