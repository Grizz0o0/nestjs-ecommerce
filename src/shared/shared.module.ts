import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { APIKeyGuard } from 'src/shared/guards/api-key.guard'
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { EmailService } from 'src/shared/services/email.service'

const shareServices = [PrismaService, HashingService, TokenService, SharedUserRepository, EmailService]

@Global()
@Module({
  providers: [
    ...shareServices,
    AccessTokenGuard,
    APIKeyGuard,
    {
      provide: 'APP_GUARD',
      useClass: AuthenticationGuard,
    },
  ],
  exports: shareServices,
  imports: [JwtModule],
})
export class SharedModule {}
