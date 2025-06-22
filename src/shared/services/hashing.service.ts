import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'

const saltRounds = 10

@Injectable()
export class HashingService {
  hash(value: string, salt?: string) {
    return hash(value, salt || saltRounds)
  }

  compare(value: string, hash: string) {
    return compare(value, hash)
  }
}
