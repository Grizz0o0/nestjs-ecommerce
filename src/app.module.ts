import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from 'src/shared/shared.module'
import { AuthModule } from 'src/routes/auth/auth.module'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { LanguageModule } from './routes/language/language.module'
import { PermissionModule } from './routes/permission/permission.module';
import { RoleModule } from './routes/role/role.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    LanguageModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'shared/images'),
      serveRoot: '/images',
    }),
    PermissionModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
