import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const port = process.env.PORT || 3000
  app.setGlobalPrefix('v1/api')
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? `http://localhost:${port}`,
    credentials: true,
  })

  await app.listen(port)
}
bootstrap()
