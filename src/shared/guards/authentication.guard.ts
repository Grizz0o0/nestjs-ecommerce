import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  AUTH_TYPE_KEY,
  AuthType,
  AuthTypeValue,
  ConditionGuard,
} from 'src/shared/constants/auth.constant'
import { AuthTypeDecorator } from 'src/shared/decorators/auth.decorator'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { APIKeyGuard } from 'src/shared/guards/api-key.guard'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly allowAllGuard: CanActivate = { canActivate: () => true }
  private readonly authTypeGuardMap: Record<AuthTypeValue, CanActivate>

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: APIKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.ApiKey]: this.apiKeyGuard,
      [AuthType.None]: this.allowAllGuard,
    }
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.getAuthTypeValue(context)
    const guard = authTypeValue.authType.map((authType) => {
      const guardInstance = this.authTypeGuardMap[authType]
      if (!guardInstance) throw new UnauthorizedException(`Unsupported auth type: ${authType}`)
      return guardInstance
    })

    return authTypeValue.options.condition === ConditionGuard.Or
      ? this.handleOrCondition(guard, context)
      : this.handleAndCondition(guard, context)
  }

  private getAuthTypeValue(context: ExecutionContext): AuthTypeDecorator {
    return (
      this.reflector.getAllAndOverride<AuthTypeDecorator>(AUTH_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? { authType: [AuthType.Bearer], options: { condition: ConditionGuard.And } }
    )
  }

  private async handleOrCondition(guards: CanActivate[], context: ExecutionContext) {
    let lastError: any = null
    //Duyệt qua hết các guard và nếu có guard pass nào trả về true
    for (const guard of guards) {
      try {
        if (await guard.canActivate(context)) return true
      } catch (error) {
        lastError = error
      }
    }
    if (lastError instanceof HttpException) throw lastError
    throw new UnauthorizedException()
  }

  private async handleAndCondition(guards: CanActivate[], context: ExecutionContext) {
    //Duyệt qua hết các guard và nếu mọi guard đều pass thì return true
    for (const guard of guards) {
      try {
        if (!(await guard.canActivate(context))) throw new UnauthorizedException()
      } catch (error) {
        if (error instanceof HttpException) throw error

        throw new UnauthorizedException()
      }
    }
    return true
  }
}
