import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod } from 'src/shared/constants/permission.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3010)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router

  const permissionInDb = await prisma.permission.findMany({
    where: { deletedAt: null },
  })
  if (permissionInDb.length > 0) {
    console.log('Permissions already exist in the database, exiting...')
    process.exit(0)
  }

  const availableRoutes: {
    path: string
    method: keyof typeof HTTPMethod
    name: string
    description: string
  }[] = router.stack
    .map((layer) => {
      if (layer.route) {
        const path = layer.route?.path
        const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
        return {
          path,
          method,
          name: method + ' ' + path,
          description: '',
        }
      }
    })
    .filter((item) => item !== undefined)

  // Tạo object permissionInDbMap với key là [method-path]
  const permissionInDbMap = permissionInDb.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  })
  // Tạo object availableRoutesMap với key là [method-path]
  const availableRoutesMap = availableRoutes.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  })

  // Tìm permission trong databases mà không tồn tại trong availableRoutes
  const permissionsToRemove = Object.keys(permissionInDbMap).filter(
    (key) => !availableRoutesMap[key],
  )
  // Xóa permission trong database
  if (permissionsToRemove.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionsToRemove.map((key) => permissionInDbMap[key].id),
        },
      },
    })
    console.log('Deleted permissions:', deleteResult.count)
  } else {
    console.log('No permissions to delete')
  }

  // Tìm permission trong availableRoutes mà không tồn tại trong databases
  const permissionsToAdd = Object.keys(availableRoutesMap).filter((key) => !permissionInDbMap[key])
  // Tạo permission trong database
  if (permissionsToAdd.length > 0) {
    const addResult = await prisma.permission.createMany({
      data: permissionsToAdd.map((key) => availableRoutesMap[key]),
      skipDuplicates: true,
    })
    console.log('Added permissions:', addResult.count)
  } else {
    console.log('No permissions to add')
  }

  process.exit(0)
}
bootstrap()
