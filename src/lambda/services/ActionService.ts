import { Logger } from '@aws-lambda-powertools/logger'
import { createCollection, mplCore } from '@metaplex-foundation/mpl-core'
import {
  createNoopSigner,
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
  signerPayer,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import { ActionPostResponse, createPostResponse } from '@solana/actions'
import { ActionGetResponse } from '@solana/actions-spec'
import { InternalServerError } from 'http-errors'
import { KeyService } from './KeyService'
import { getMandatoryEnv } from '../../utils/getMandatoryEnv'
import { CreateCollectionRequest } from '../types/CreateCollectionRequest'

export class ActionService {
  private readonly logger = new Logger({ serviceName: 'ActionService' })
  private readonly keyService: KeyService
  private readonly solanaRpcNode = getMandatoryEnv('SOLANA_RPC_NODE')

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

  createCollection = async (request: CreateCollectionRequest): Promise<ActionPostResponse> => {
    try {
      this.logger.info('Create collection', { request })
      const umi = createUmi(this.solanaRpcNode).use(mplCore())

      const { privateKey, name } = await this.keyService.generateNewKey(request.name)
      const keypair = umi.eddsa.createKeypairFromSecretKey(privateKey)
      const signer = createSignerFromKeypair(umi, keypair)
      const payer = createNoopSigner(publicKey(request.account))
      umi.use(signerIdentity(signer))
      umi.use(signerPayer(payer))

      const collection = createCollection(umi, {
        collection: signer,
        name,
        uri: request.url,
        payer: payer,
        updateAuthority: signer.publicKey,
      })
      this.logger.info('Created collection', { collection })
      const transaction = await collection.buildWithLatestBlockhash(umi)
      this.logger.info(`Created transaction ${transaction.serializedMessage}`, { message: transaction.message })
      const solanaTransaction = toWeb3JsTransaction(transaction)
      return await createPostResponse({
        fields: {
          type: 'transaction',
          transaction: solanaTransaction,
        },
      })
    } catch (e) {
      this.logger.error('Failed to create collection', { error: e })
      throw InternalServerError('Failed to create the collection')
    }
  }
}