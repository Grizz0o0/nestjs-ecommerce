import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { GLOBAL_PREFIX } from 'src/shared/constants/app.constant'
import { HTTPMethod } from 'src/shared/constants/permission.constant'
import { RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3010)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router
  const permissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })
  const availableRoutes: {
    path: string
    method: keyof typeof HTTPMethod
    name: string
    module: string
  }[] = router.stack
    .map((layer) => {
      if (layer.route) {
        const path = `/${GLOBAL_PREFIX}${layer.route?.path}`
        const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
        const module = layer.route?.path.split('/')[1]
        return {
          path,
          method,
          name: method + ' ' + path,
          module,
        }
      }
    })
    .filter((item) => item !== undefined)
  // Tạo object permissionInDbMap với key là [method-path]
  const permissionInDbMap: Record<string, (typeof permissionsInDb)[0]> = permissionsInDb.reduce(
    (acc, item) => {
      acc[`${item.method}-${item.path}`] = item
      return acc
    },
    {},
  )
  // Tạo object availableRoutesMap với key là [method-path]
  const availableRoutesMap: Record<string, (typeof availableRoutes)[0]> = availableRoutes.reduce(
    (acc, item) => {
      acc[`${item.method}-${item.path}`] = item
      return acc
    },
    {},
  )

  // Tìm permissions trong database mà không tồn tại trong availableRoutes
  const permissionsToDelete = permissionsInDb.filter((item) => {
    return !availableRoutesMap[`${item.method}-${item.path}`]
  })
  // Xóa permissions không tồn tại trong availableRoutes
  if (permissionsToDelete.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionsToDelete.map((item) => item.id),
        },
      },
    })
    console.log('Deleted permissions:', deleteResult.count)
  } else {
    console.log('No permissions to delete')
  }
  // Tìm routes mà không tồn tại trong permissionsInDb
  const routesToAdd = availableRoutes.filter((item) => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })
  // Thêm các routes này dưới dạng permissions database
  if (routesToAdd.length > 0) {
    const permissionsToAdd = await prisma.permission.createMany({
      data: routesToAdd,
      skipDuplicates: true,
    })
    console.log('Added permissions:', permissionsToAdd.count)
  } else {
    console.log('No permissions to add')
  }

  // Lấy lại permission trong database
  const updatedPermissions = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  // Cập nhật lại permissions cho role Admin
  const adminRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Admin, deletedAt: null },
  })

  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        set: updatedPermissions.map((p) => ({ id: p.id })),
      },
    },
  })

  process.exit(0)
}
bootstrap()
