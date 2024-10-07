import { Logger } from '@aws-lambda-powertools/logger'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getMandatoryEnv } from '../../utils/getMandatoryEnv'
import { SaveFileRequest } from '../types/SaveFileRequest'

export class FileService {
  private readonly logger = new Logger({ serviceName: 'FileService' })
  private readonly s3Client: S3Client
  private readonly bucketName: string
  private readonly domain: string

  constructor(
    s3Client: S3Client = new S3Client(),
    bucketName: string = getMandatoryEnv('BUCKET_NAME'),
    domain: string = getMandatoryEnv('DOMAIN'),
  ) {
    this.s3Client = s3Client
    this.bucketName = bucketName
    this.domain = domain
  }

  /**
   * Store file and save public available url
   *
   * @param account account of the client
   * @param filename key of the new file
   * @param contentJson content of the file
   * @param addDateInKey if the key should contain the current date
   */
  saveJsonFile = async ({ account, filename, contentJson, addDateInKey = false }: SaveFileRequest): Promise<string> => {
    const today = new Date()
    const directory = addDateInKey ?
      `${account}/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}` :
      account
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${directory}/${filename}`,
      Body: JSON.stringify(contentJson),
      ContentType: 'application/json',
    })
    await this.s3Client.send(command)
    const url = `https://${this.domain}/${directory}/${encodeURIComponent(filename)}`
    this.logger.info(`Saved file ${filename} to S3`, {
      content: contentJson,
      url,
    })
    return url
  }
}