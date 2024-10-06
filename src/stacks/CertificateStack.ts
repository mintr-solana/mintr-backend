import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { IHostedZone, PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

export interface CertificateStackProps extends StackProps {
  domain: string;
}

export class CertificateStack extends Stack {
  readonly certificate: Certificate
  readonly certificateArn: string
  readonly zone: IHostedZone

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true,
      env: { account: props.env?.account, region: 'us-east-1' },
    })

    const { domain } = props

    this.zone = PublicHostedZone.fromLookup(this, 'Zone', {
      domainName: domain,
    })

    this.certificate = new Certificate(this, 'Cert', {
      domainName: domain,
      subjectAlternativeNames: [`*.${domain}`],
      validation: CertificateValidation.fromDns(this.zone),
    })
    this.certificateArn = this.certificate.certificateArn
  }
}
