import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  GetPermissionDetailResDTO,
  GetPermissionsResDTO,
  GetPermissionQueryDTO,
  CreatePermissionBodyDTO,
  GetPermissionParamsDTO,
  UpdatePermissionBodyDTO,
} from 'src/routes/permission/permission.dto'
import { PermissionService } from 'src/routes/permission/permission.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetPermissionsResDTO)
  list(@Query() query: GetPermissionQueryDTO) {
    return this.permissionService.list({ limit: Number(query.limit), page: Number(query.page) })
  }

  @Get(':permissionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetPermissionDetailResDTO)
  findById(@Param() params: GetPermissionParamsDTO) {
    return this.permissionService.findById(Number(params.permissionId))
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(GetPermissionDetailResDTO)
  create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.create({ data: body, createdById: userId })
  }

  @Patch(':permissionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetPermissionDetailResDTO)
  update(
    @Param() params: GetPermissionParamsDTO,
    @Body() body: UpdatePermissionBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.permissionService.update({
      id: Number(params.permissionId),
      data: body,
      updatedById: userId,
    })
  }

  @Delete(':permissionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetPermissionParamsDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.delete({ id: Number(params.permissionId), deletedById: userId })
  }
}
