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
  CreateRoleBodyDTO,
  GetRoleDetailParamsDTO,
  GetRoleDetailResDTO,
  GetRolesQueryDTO,
  GetRolesResDTO,
  UpdateRoleBodyDTO,
} from 'src/routes/role/role.dto'
import { RoleService } from 'src/routes/role/role.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetRolesResDTO)
  list(@Query() query: GetRolesQueryDTO) {
    return this.roleService.list({
      limit: query.limit,
      page: query.page,
    })
  }

  @Get(':roleId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetRoleDetailResDTO)
  findById(@Param() params: GetRoleDetailParamsDTO) {
    return this.roleService.findById(params.roleId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(GetRoleDetailResDTO)
  create(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.create({ data: body, createdById: userId })
  }

  @Patch(':roleId')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(GetRoleDetailResDTO)
  update(
    @Param() params: GetRoleDetailParamsDTO,
    @Body() body: UpdateRoleBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.roleService.update({ id: params.roleId, data: body, updatedById: userId })
  }

  @Delete(':roleId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetRoleDetailParamsDTO, @ActiveUser('userId') userId: number) {
    return this.roleService.delete({ id: params.roleId, deletedById: userId })
  }
}
