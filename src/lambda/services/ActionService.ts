import { Logger } from '@aws-lambda-powertools/logger'
import { mplCore } from '@metaplex-foundation/mpl-core'
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import {
  createNoopSigner,
  createSignerFromKeypair,
  percentAmount,
  publicKey,
  signerIdentity,
  signerPayer,
  signTransaction,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'
import { ActionPostResponse, createPostResponse } from '@solana/actions'
import { ActionGetResponse } from '@solana/actions-spec'
import { InternalServerError } from 'http-errors'
import { FileService } from './FileService'
import { KeyService } from './KeyService'
import { getMandatoryEnv } from '../../utils/getMandatoryEnv'
import { CreateAssetRequest } from '../types/CreateAssetRequest'

export class ActionService {
  private readonly logger = new Logger({ serviceName: 'ActionService' })
  private readonly keyService: KeyService
  private readonly fileService: FileService
  private readonly solanaRpcNode = getMandatoryEnv('SOLANA_RPC_NODE')

  constructor(keyService: KeyService, fileService: FileService) {
    this.keyService = keyService
    this.fileService = fileService
  }

  getOneOfActionDefinition = (): ActionGetResponse => ({
    description: 'Create a NFT',
    title: 'NFT creation',
    icon: 'https://assets.mintr.click/logo.svg',
    label: 'Create a NFT',
    links: {
      actions: [
        {
          type: 'message',
          label: 'Create NFT 🚀',
          href: '/collections/create-nft?name={name}&url={url}',
          parameters: [
            {
              name: 'name',
              label: 'NFT name',
              required: true,
              type: 'text',
              pattern: '[a-zA-Z0-9]{4-50}',
              patternDescription: '4 to 50 letters or digits',
            },
            {
              name: 'url',
              label: 'Image url',
              required: true,
              type: 'url',
            },
          ],
        },
      ],
    },
  })

  createAsset = async (request: CreateAssetRequest): Promise<ActionPostResponse> => {
    try {
      this.logger.info('Create asset', { request })
      const umi = createUmi(this.solanaRpcNode).use(mplCore())

      const { privateKey, name } = await this.keyService.generateNewKey(request.name)
      const keypair = umi.eddsa.createKeypairFromSecretKey(privateKey)
      const signer = createSignerFromKeypair(umi, keypair)
      const payer = createNoopSigner(publicKey(request.account))
      umi.use(signerIdentity(signer))
      umi.use(signerPayer(payer))
      umi.use(mplTokenMetadata())

      const today = new Date()
      const assetInfo = {
        name,
        description: name,
        image: request.url,
      }
      const assetInfoUrl = await this.fileService.saveJsonFile({
        filename: `${request.account}/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}/${encodeURIComponent(name)}.json`,
        contentJson: assetInfo,
      })

      const asset = createNft(umi, {
        mint: signer,
        symbol: 'MINTR',
        name,
        sellerFeeBasisPoints: percentAmount(1),
        uri: assetInfoUrl,
        payer: payer,
        updateAuthority: signer.publicKey,
      })
      this.logger.info('Created asset', { asset })
      const transaction = await asset.buildWithLatestBlockhash(umi)
      const signedTransaction = await signTransaction(transaction, [signer])
      const solanaTransaction = toWeb3JsTransaction(signedTransaction)
      this.logger.info('Created transaction', {
        transaction: solanaTransaction,
      })
      return await createPostResponse({
        fields: {
          type: 'transaction',
          transaction: solanaTransaction,
        },
      })
    } catch (e) {
      this.logger.error('Failed to create asset', { error: e })
      throw InternalServerError('Failed to create the asset')
    }
  }
}