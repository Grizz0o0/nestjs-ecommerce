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
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  GetLanguageDetailResDTO,
  GetLanguagesResDTO,
  CreateLanguageBodyDTO,
  GetLanguageParamsDTO,
  UpdateLanguageBodyDTO,
} from 'src/routes/language/language.dto'
import { LanguageService } from 'src/routes/language/language.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetLanguagesResDTO)
  @IsPublic()
  findAll() {
    return this.languageService.findAll()
  }

  @Get(':languageId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetLanguageDetailResDTO)
  @IsPublic()
  findById(@Param() params: GetLanguageParamsDTO) {
    return this.languageService.findById(params.languageId)
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(GetLanguageDetailResDTO)
  create(@Body() body: CreateLanguageBodyDTO, @ActiveUser('userId') userId: number) {
    return this.languageService.create({
      data: body,
      createdById: userId,
    })
  }

  @Patch(':languageId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetLanguageDetailResDTO)
  update(
    @Param() params: GetLanguageParamsDTO,
    @Body() body: UpdateLanguageBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.languageService.update({ id: params.languageId, data: body, updatedById: userId })
  }

  @Delete(':languageId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: GetLanguageParamsDTO, @ActiveUser('userId') userId: number) {
    return this.languageService.delete({ id: params.languageId, deletedById: userId })
  }
}
