import { createZodDto } from 'nestjs-zod'
import { MessageResSchema } from 'src/shared/model/response.model'

export class MessageResponseDto extends createZodDto(MessageResSchema) {}
