import { Logger } from '@aws-lambda-powertools/logger'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpRouterHandler, { Route } from '@middy/http-router'
import httpSecurityHeaders from '@middy/http-security-headers'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ActionService } from './services/ActionService'
import { badRequest } from '../utils/badRequest'
import { notFound } from '../utils/notFound'
import { ok } from '../utils/ok'
import { FileService } from './services/FileService'
import { KeyService } from './services/KeyService'

const logger: Logger = new Logger({ serviceName: 'api' })
const keyService = new KeyService()
const fileService = new FileService()
const actionService = new ActionService(keyService, fileService)

const routes: Route<APIGatewayProxyEventV2, APIGatewayProxyResultV2>[] = [
  {
    method: 'GET',
    path: '/collections/create-nft',
    handler: middy()
      .handler(async (): Promise<APIGatewayProxyResultV2> => {
        const definition = actionService.getOneOfActionDefinition()
        return {
          statusCode: 200,
          body: JSON.stringify(definition),
        }
      }),
  },
  {
    method: 'POST',
    path: '/collections/create-nft',
    handler: middy()
      .handler(async (event) => {
        const name = event.queryStringParameters?.name
        if (!name || name.length < 4 || name.length > 50) {
          return badRequest('name is missing or invalid')
        }
        const url = event.queryStringParameters?.url
        if (!url || url.length < 5) {
          return badRequest('url is missing or invalid')
        }
        const body = event.body
        if (!body) {
          return badRequest('body is missing')
        }
        const bodyParsed = JSON.parse(body)
        if (!bodyParsed.account) {
          return badRequest('account is missing')
        }
        const collectionResponse = await actionService.createAsset({
          name,
          url,
          account: bodyParsed.account,
        })
        return ok(collectionResponse)
      }),
  },
  {
    method: 'ANY',
    path: '/{proxy+}',
    handler: middy()
      .handler(async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
        return notFound(`${event.requestContext.http.method} '${event.rawPath}' not found`)
      }),
  },
]

export const handler = middy(httpRouterHandler(routes))
  .use(injectLambdaContext(logger, { logEvent: false }))
  .use(httpErrorHandler())
  .use(httpHeaderNormalizer())
  .use(httpSecurityHeaders({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  }))
