import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Construct } from 'constructs'
import { CloudfrontServedS3Bucket } from '../constructs/CloudfrontServedS3Bucket'

export interface FrontendStackProps extends StackProps {
  domain: string;
  certificateArn: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props)

    const { domain, certificateArn } = props

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', certificateArn)

    new CloudfrontServedS3Bucket(this, 'Frontend', {
      domain,
      certificate,
      bucketName: 'mintr.frontend',
      createDeploymentUser: true,
    })
  }
}