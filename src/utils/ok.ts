import { APIGatewayProxyResultV2 } from 'aws-lambda'

export const ok = (body: string | any): APIGatewayProxyResultV2 => {
  if (typeof body === 'string') {
    return { statusCode: 200, body: JSON.stringify({ message: body }) }
  }
  return { statusCode: 200, body: JSON.stringify(body) }
}