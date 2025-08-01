import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'

// OTP related errors
export const InvalidOTPException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidOTP',
    path: 'code',
  },
])

export const OTPExpiredException = new UnprocessableEntityException([
  {
    message: 'Error.OTPExpired',
    path: 'code',
  },
])

export const FailedToSendOTPException = new UnprocessableEntityException([
  {
    message: 'Error.FailedToSendOTP',
    path: 'code',
  },
])

// Email related errors
export const EmailAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.EmailAlreadyExists',
    path: 'email',
  },
])

export const EmailNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.EmailNotFound',
    path: 'email',
  },
])

// Password related errors
export const InvalidPasswordException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidPassword',
    path: 'password',
  },
])

// Auth token related errors
export const RefreshTokenAlreadyUsedException = new UnauthorizedException(
  'Error.RefreshTokenAlreadyUsed',
)
export const UnauthorizedAccessException = new UnauthorizedException('Error.UnauthorizedAccess')

// Google auth related errors
export const GoogleUserInfoError = new Error('Error.FailedToGetGoogleUserInfo')

export const TOTPAlreadyEnabledException = new UnprocessableEntityException([
  {
    message: 'Error.TOTPAlreadyEnabled',
    path: 'totpCode',
  },
])

export const TOTPNotEnabledException = new UnprocessableEntityException([
  {
    message: 'Error.TOTPNotEnabled',
    path: 'totpCode',
  },
])

export const InvalidTOTPAndCodeException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidTOTPAndCode',
    path: 'totpCode',
  },
  {
    message: 'Error.InvalidTOTPAndCode',
    path: 'code',
  },
])

export const InvalidTOTPCodeException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidTOTPCode',
    path: 'totpCode',
  },
])
