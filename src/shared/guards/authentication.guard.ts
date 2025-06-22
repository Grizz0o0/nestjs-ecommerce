import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AUTH_TYPE_KEY, AuthType, AuthTypeValue, ConditionGuard } from 'src/shared/constants/auth.constant'
import { AuthTypeDecorator } from 'src/shared/decorators/auth.decorator'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { APIKeyGuard } from 'src/shared/guards/api-key.guard'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly allowAllGuard: CanActivate = { canActivate: () => true }

  private get authTypeGuardMap(): Record<AuthTypeValue, CanActivate> {
    return {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.ApiKey]: this.apiKeyGuard,
      [AuthType.None]: this.allowAllGuard,
    }
  }

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: APIKeyGuard,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecorator>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { authType: [AuthType.None], options: { condition: ConditionGuard.And } }

    const guard = authTypeValue.authType.map((authType) => {
      const guardInstance = this.authTypeGuardMap[authType]
      if (!guardInstance) throw new UnauthorizedException(`Unsupported auth type: ${authType}`)
      return guardInstance
    })

    let error = new UnauthorizedException()
    if (authTypeValue.options.condition === ConditionGuard.Or) {
      for (const instance of guard) {
        const canActivate = await Promise.resolve(instance.canActivate(context)).catch((e) => {
          error = e
          return false
        })
        if (canActivate) return true
      }
      throw error
    } else {
      for (const instance of guard) {
        const canActivate = await instance.canActivate(context)
        if (!canActivate) throw error
      }
      return true
    }
  }
}
