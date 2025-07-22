import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { HTTPMethod } from '@prisma/client'
import { Request } from 'express'
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayload } from 'src/types/jwt.type'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest()
    // Extract and validate the access token from the request
    const accessTokenPayload = await this.extractTokenAndValidate(request)

    // Check user permissions
    await this.validateUserPermissions(accessTokenPayload, request)
    return true
  }

  private async extractTokenAndValidate(request: Request): Promise<AccessTokenPayload> {
    const accessToken = this.extractAccessTokenFromHeader(request)

    try {
      const decodeAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      request[REQUEST_USER_KEY] = decodeAccessToken
      return decodeAccessToken
    } catch {
      throw new UnauthorizedException('Error:InvalidAccessToken')
    }
  }

  private extractAccessTokenFromHeader(request: Request): string {
    const accessToken = request.headers.authorization?.split(' ')[1]
    if (!accessToken) throw new UnauthorizedException()
    return accessToken
  }

  private async validateUserPermissions(
    accessTokenPayload: AccessTokenPayload,
    request: Request,
  ): Promise<boolean> {
    const roleId = accessTokenPayload.roleId
    const path = request.route?.path
    const method = request.method as HTTPMethod
    const role = await this.prismaService.role
      .findUniqueOrThrow({
        where: { id: roleId, isActive: true, deletedAt: null },
        include: { permissions: { where: { deletedAt: null, path, method } } },
      })
      .catch(() => {
        throw new ForbiddenException('Error:PermissionDenied')
      })
    const canAccess = role.permissions.some(
      (permission) => permission.path === path && permission.method === method,
    )
    if (!canAccess) {
      throw new ForbiddenException('Error:PermissionDenied')
    }
    return true
  }
}
