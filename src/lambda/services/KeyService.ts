import { Logger } from '@aws-lambda-powertools/logger'
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { badRequest } from '../../utils/badRequest'
import { getMandatoryEnv } from '../../utils/getMandatoryEnv'
import { SaveKeyRequest } from '../types/SaveKeyRequest'

export class KeyService {
  private readonly logger = new Logger({ serviceName: 'KeyService' })
  private readonly dynamoDb = new DynamoDBClient()
  private readonly tableName = getMandatoryEnv('TABLE_NAME')

  saveKey = async ({ name, key }: SaveKeyRequest) => {
    try {
      await this.dynamoDb.send(new PutItemCommand({
        Item: marshall({
          name,
          value: key,
          key: name,
          createdAt: new Date().toISOString(),
        }),
        TableName: this.tableName,
        ConditionExpression: 'attribute_not_exists(#key)',
        ExpressionAttributeNames: {
          '#key': 'key',
        },
      }))
    } catch (e) {
      this.logger.error(`Failed to store key for name ${name}`, { name, error: e })
      badRequest(`Key for name ${name} already exists`)
    }
  }

  getKey = async (name: string): Promise<string> => {
    try {
      const response = await this.dynamoDb.send(new GetItemCommand({
        Key: marshall({ key: name }),
        TableName: this.tableName,
      }))
      if (!response.Item) {
        throw new Error('No item found')
      }
      const body = unmarshall(response.Item)
      return body.value as string
    } catch (e) {
      this.logger.error(`Failed to find key for name ${name}`, { error: e, name })
      return badRequest(`Could not find key for name ${name}`)
    }
  }
}