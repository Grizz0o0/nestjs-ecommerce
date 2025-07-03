import { HttpException, Injectable } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import {
  ForgotPasswordBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from 'src/routes/auth/auth.model'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidPasswordException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  UnauthorizedAccessException,
} from 'src/routes/auth/error.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RolesService } from 'src/routes/auth/roles.service'
import { generateOTP, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import envConfig from 'src/shared/config'
import { TypeOfValidationCode, TypeOfValidationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { LoginBodyDTO } from 'src/routes/auth/auth.dto'
import { AccessTokenPayloadCreate } from 'src/types/jwt.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async validateValidationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfValidationCodeType
  }) {
    const validationCode = await this.authRepository.findUniqueValidationCode({
      email,
      code,
      type,
    })
    if (!validationCode) throw InvalidOTPException
    if (validationCode.expiresAt < new Date()) throw OTPExpiredException

    return validationCode
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateValidationCode({
        email: body.email,
        code: body.code,
        type: TypeOfValidationCode.REGISTER,
      })

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      return this.authRepository.createUser({
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw EmailAlreadyExistsException
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra xem email đã tồn tại trong hệ thống chưa
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (body.type === TypeOfValidationCode.REGISTER && user) throw EmailAlreadyExistsException
    if (body.type === TypeOfValidationCode.FORGOT_PASSWORD && !user) throw EmailNotFoundException

    // 2. Tạo mã xác thực mới
    const code = generateOTP()
    await this.authRepository.createValidationCode({
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

    if (error) throw FailedToSendOTPException

    return { message: 'Mã xác thực OTP đã được gửi đến email của bạn' }
  }

  async login(body: LoginBodyDTO & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })
    if (!user) throw EmailNotFoundException

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) throw InvalidPasswordException

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

  async refreshToken({
    refreshToken,
    ip,
    userAgent,
  }: RefreshTokenBodyType & { ip: string; userAgent: string }) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      })
      if (!refreshTokenInDb) throw RefreshTokenAlreadyUsedException

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
      throw UnauthorizedAccessException
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Xóa refreshToken trong database
      const deleteRefreshToken = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      // 3. Cập nhật device là đã logout
      await this.authRepository.updateDevice(deleteRefreshToken.deviceId, { isActive: false })

      return { message: 'Đăng xuất thành công' }
    } catch (error) {
      if (error instanceof HttpException) {
        throw RefreshTokenAlreadyUsedException
      }
      throw UnauthorizedAccessException
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    //1. Kiểm tra tài khoản đã được đăng kí chưa ?
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (!user) throw EmailNotFoundException

    //2. Kiểm tra OTP có hợp lệ không
    await this.validateValidationCode({
      email: body.email,
      code: body.code,
      type: TypeOfValidationCode.FORGOT_PASSWORD,
    })

    //3. Cập nhật mật khẩu và xóa OTP
    const hashedPassword = await this.hashingService.hash(body.newPassword)
    await this.authRepository.updateUser({ email: body.email }, { password: hashedPassword })
    await this.authRepository.deleteVerificationCode({
      email: body.email,
      code: body.code,
      type: TypeOfValidationCode.FORGOT_PASSWORD,
    })

    return { message: 'Đổi mật khẩu thành công' }
  }
}
