import { Injectable } from '@nestjs/common'
import {
  DeviceType,
  RefreshTokenType,
  RegisterBodyType,
  RoleType,
  ValidationCodeType,
} from 'src/routes/auth/auth.model'
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

  async createRefreshToken(data: { userId: number; deviceId: number; expiresAt: Date; token: string }) {
    return this.prismaService.refreshToken.create({
      data,
    })
  }

  async createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({
      data,
    })
  }

  async findUniqueUserIncludeRole(
    uniqueObject: { email: string } | { id: number },
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({ where: uniqueObject, include: { role: true } })
  }

  async findUniqueRefreshTokenIncludeUserRole(uniqueObject: {
    token: string
  }): Promise<(RefreshTokenType & { user: UserType & { role: RoleType } }) | null> {
    return this.prismaService.refreshToken.findUnique({
      where: uniqueObject,
      include: { user: { include: { role: true } } },
    })
  }

  async deleteRefreshToken(uniqueObject: { token: string }): Promise<RefreshTokenType> {
    return this.prismaService.refreshToken.delete({
      where: uniqueObject,
    })
  }

  async updateDevice(deviceId: number, data: Partial<DeviceType>): Promise<DeviceType> {
    return this.prismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    })
  }
}
