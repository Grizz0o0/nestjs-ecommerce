import envConfig from 'src/shared/config'
import { RoleName } from 'src/shared/constants/role.constant'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
const prisma = new PrismaService()
const hashingService = new HashingService()

const main = async () => {
  const roleCount = await prisma.role.count()
  if (roleCount > 0) {
    throw Error('Roles already exist')
  }
  const role = await prisma.role.createMany({
    data: [
      { name: RoleName.Admin, description: 'Admin role' },
      { name: RoleName.Seller, description: 'Seller role' },
      { name: RoleName.Client, description: 'Client role' },
    ],
  })

  const adminRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Admin },
  })

  const hashPassword = await hashingService.hash(envConfig.ADMIN_PASSWORD)
  const adminUser = await prisma.user.create({
    data: {
      name: envConfig.ADMIN_NAME,
      email: envConfig.ADMIN_EMAIL,
      password: hashPassword,
      phoneNumber: envConfig.ADMIN_PHONENUMBER,
      roleId: adminRole.id,
    },
  })

  return {
    createdRoleCount: role.count,
    adminUser,
  }
}

main()
  .then(({ createdRoleCount, adminUser }) => {
    console.log(`Created ${createdRoleCount} roles and admin user with id ${adminUser.id}`)
  })
  .catch(console.error)
