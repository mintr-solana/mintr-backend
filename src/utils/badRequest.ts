import { BadRequest } from 'http-errors'

export const badRequest = (body: string | any): never => {
  if (typeof body === 'string') {
    throw BadRequest(JSON.stringify({ message: body }))
  }
  throw BadRequest(JSON.stringify(body))
}