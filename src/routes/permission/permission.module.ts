import { Module } from '@nestjs/common'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { PermissionRepo } from 'src/routes/permission/permission.repo'

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepo],
})
export class PermissionModule {}
