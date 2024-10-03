import { NotFound } from 'http-errors'

export const notFound = (body: string | any): never => {
  if (typeof body === 'string') {
    throw NotFound(JSON.stringify({ message: body }))
  }
  throw NotFound(JSON.stringify(body))
}