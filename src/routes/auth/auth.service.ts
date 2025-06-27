import { HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import { RefreshTokenBodyType, RegisterBodyType, SendOTPBodyType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RolesService } from 'src/routes/auth/roles.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfValidationCode } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { LoginBodyDTO } from 'src/routes/auth/auth.dto'
import { AccessTokenPayloadCreate } from 'src/types/jwt.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
  ) {}
  async register(body: RegisterBodyType) {
    try {
      const validationCode = await this.authRepository.findUniqueValidationCode({
        email: body.email,
        code: body.code,
        type: TypeOfValidationCode.REGISTER,
      })
      if (!validationCode)
        throw new UnauthorizedException([
          {
            message: 'Mã xác thực OTP không hợp lệ',
            path: 'code',
          },
        ])

      if (validationCode.expiresAt < new Date())
        throw new UnauthorizedException([
          {
            message: 'Mã xác thực OTP đã hết hạn',
            path: 'code',
          },
        ])

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      return await this.authRepository.createUser({
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnauthorizedException([{ message: 'Email đã tồn tại trong hệ thống', path: 'email' }])
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra xem email đã tồn tại trong hệ thống chưa
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (user) {
      throw new UnauthorizedException([
        {
          message: 'Email đã tồn tại trong hệ thống',
          path: 'email',
        },
      ])
    }

    // 2. Tạo mã xác thực mới
    const code = generateOTP()
    const validationCode = await this.authRepository.createValidationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })

    // 3. Gửi mã xác thực đến email
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    })

    if (error) {
      throw new UnauthorizedException([
        {
          message: 'Gửi mã xác thực OTP thất bại',
          path: 'email',
        },
      ])
    }

    return validationCode
  }

  async login(body: LoginBodyDTO & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })
    if (!user)
      throw new UnauthorizedException([
        {
          message: 'Email chưa được đăng ký',
          path: 'email',
        },
      ])

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch)
      throw new UnprocessableEntityException([
        {
          field: 'password',
          error: 'Mật khẩu không khớp',
        },
      ])

    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })
    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })

    return tokens
  }

  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
      }),
    ])
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      userId,
      deviceId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      token: refreshToken,
    })
    return { accessToken, refreshToken }
  }

  async refreshToken({ refreshToken, ip, userAgent }: RefreshTokenBodyType & { ip: string; userAgent: string }) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      })
      if (!refreshTokenInDb) {
        throw new UnauthorizedException([
          {
            message: 'Refresh token không hợp lệ hoặc đã bị thu hồi',
            path: 'refreshToken',
          },
        ])
      }

      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDb

      // 3. Cập nhật lastActive cho device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      })
      // 4. Xóa refreshToken cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({ userId, deviceId, roleId, roleName })

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens])
      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Xóa refreshToken trong database
      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      })
      return { message: 'Logout successfully' }
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      throw new UnauthorizedException()
    }
  }
}
