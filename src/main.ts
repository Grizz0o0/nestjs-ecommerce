import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('v1/api')
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3052',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
