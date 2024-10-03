import { Logger } from '@aws-lambda-powertools/logger'
import { ActionGetResponse } from '@solana/actions-spec'
import { KeyService } from './KeyService'
import { CreateCollectionRequest } from '../types/CreateCollectionRequest'

export class ActionService {
  private readonly logger = new Logger({ serviceName: 'ActionService' })
  private readonly keyService: KeyService

  constructor(keyService: KeyService) {
    this.keyService = keyService
  }

  getOneOfActionDefinition = (): ActionGetResponse => ({
    description: 'Create a NFT collection',
    title: 'NFT collection creation',
    icon: 'https://mintr.click/create-one-ob-banner.webp',
    label: 'Create a NFT collection',
    links: {
      actions: [
        {
          type: 'message',
          label: 'Create collection 🚀',
          href: '/collections/create-one-of?price={price}&name={name}&url={url}&supply={supply}',
          parameters: [
            {
              name: 'name',
              label: 'Collection name',
              required: true,
              type: 'text',
              pattern: '[a-zA-Z0-9]{4-10}',
              patternDescription: '4 to 10 letters or digits',
            },
            {
              name: 'url',
              label: 'Image url',
              required: true,
              type: 'url',
            },
            {
              name: 'supply',
              label: 'Collection supply',
              required: true,
              type: 'number',
              min: 1,
            },
            {
              name: 'price',
              label: 'Mint price',
              required: true,
              type: 'number',
              min: 0,
            },
          ],
        },
      ],
    },
  })

  createCollection = async (request: CreateCollectionRequest) => {
    this.logger.info('Create collection', { request })
    // TODO angad

    // example for key storage:
    await this.keyService.saveKey({ name: 'my-test', key: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]) })

    // example for retrieving the key:
    const key = await this.keyService.getKey('my-test')
    this.logger.info(`Key found: ${key}`)
  }
}