import { HttpException, Injectable } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import {
  DisableTwoFactorAuthBodyType,
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
  InvalidTOTPAndCodeException,
  InvalidTOTPCodeException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
  UnauthorizedAccessException,
} from 'src/routes/auth/auth.errror'
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
import { TwoFactorAuthService } from 'src/shared/services/2fa.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
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
      email_code_type: {
        email,
        code,
        type,
      },
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
    //1. Lấy thông tin user, kiểm tra user có tồn tại hay không, mật khẩu có đúng không?

    const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })
    if (!user) throw EmailNotFoundException

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) throw InvalidPasswordException
    //2. Nếu user đã bật mã 2FA thì yêu cầu nhập mã 2FA TOTP Code hoặc OTP code
    if (user.totpSecret) {
      // Nếu không có mã TOTP và Code
      if (!body.totpCode && !body.code) throw InvalidTOTPAndCodeException

      //Kiểm tra TOTP Code có hợp lệ không
      if (body.totpCode) {
        const inValid = this.twoFactorAuthService.verifyTOTP({
          email: body.email,
          token: body.totpCode,
          secret: user.totpSecret,
        })

        if (!inValid) throw InvalidTOTPCodeException
      } else if (body.code) {
        //Kiểm tra OTP Code có hợp lệ không
        await this.validateValidationCode({
          email: body.email,
          code: body.code,
          type: TypeOfValidationCode.LOGIN,
        })
      }
    }

    //3 Tạo mới device cho user
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })

    //4 Tạo mới accessToken và refreshToken
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
      email_code_type: {
        email: body.email,
        code: body.code,
        type: TypeOfValidationCode.FORGOT_PASSWORD,
      },
    })

    return { message: 'Đổi mật khẩu thành công' }
  }

  async setupTwoFactorAuth(userId: number) {
    //1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không và xem họ đã bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw EmailNotFoundException
    if (user.totpSecret) throw TOTPAlreadyEnabledException

    //2. Tạo ra secret và uri
    const { secret, uri } = this.twoFactorAuthService.generateTOTPSecret(user.email)

    //3. Cập nhật secret vào user trong database
    await this.authRepository.updateUser({ id: userId }, { totpSecret: secret })
    //4. Trả về secret và uri
    return { secret, uri }
  }

  async disableTwoFactorAuth(data: DisableTwoFactorAuthBodyType & { userId: number }) {
    const { userId, code, totpCode } = data
    //1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không và xem họ bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw EmailNotFoundException
    if (!user.totpSecret) throw TOTPNotEnabledException

    //2. Kiểm tra TOTP Code có hợp lệ hay không
    if (totpCode) {
      const isValid = this.twoFactorAuthService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })

      if (!isValid) throw InvalidTOTPCodeException
    } else if (code) {
      //3. Kiểm tra mã OTP code có hợp lệ hay không
      await this.validateValidationCode({
        email: user.email,
        code,
        type: TypeOfValidationCode.DISABLE_2FA,
      })
    }

    //4 Cập nhật secret thành null
    await this.authRepository.updateUser({ id: userId }, { totpSecret: null })

    //5 Trả về thông báo
    return { message: 'Tắt 2FA thành công' }
  }
}
