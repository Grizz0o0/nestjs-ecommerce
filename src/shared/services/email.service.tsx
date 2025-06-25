import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'
import fs from 'fs'
import path from 'path'
import * as React from 'react'
import { OTPEmail } from 'emails/otp'
@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã xác thực OTP của bạn'
    const otpTemplate = fs.readFileSync(path.resolve('src/shared/email-templates/otp.html'), 'utf-8')
    const logo = 'http://localhost:3000/images/logo.png'
    const htmlContent = otpTemplate.replace('{{code}}', payload.code).replace('{{logo}}', logo)
    return this.resend.emails.send({
      from: 'Grizz <no-reply@vuonghongky.id.vn>',
      to: [payload.email],
      subject,
      react: <OTPEmail otpCode={payload.code} title={subject} />,
    })
  }
}
