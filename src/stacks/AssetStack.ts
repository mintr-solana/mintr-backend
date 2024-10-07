import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { CloudfrontServedS3Bucket } from '../constructs/CloudfrontServedS3Bucket'

export interface AssetStackProps extends StackProps {
  domain: string;
  cname: string;
  certificateArn: string;
}

export class AssetStack extends Stack {
  readonly bucket: Bucket

  constructor(scope: Construct, id: string, props: AssetStackProps) {
    super(scope, id, props)

    const { domain, cname, certificateArn } = props

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', certificateArn)

    const { bucket } = new CloudfrontServedS3Bucket(this, 'Assets', {
      domain,
      cname,
      certificate,
      bucketName: 'mintr.assets',
    })
    this.bucket = bucket
  }
}