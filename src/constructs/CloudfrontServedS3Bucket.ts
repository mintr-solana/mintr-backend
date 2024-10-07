import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  AllowedMethods,
  CacheHeaderBehavior,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { AccessKey, User } from 'aws-cdk-lib/aws-iam'
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface CloudfrontServedS3BucketProps {
  certificate: ICertificate;
  domain: string;
  cname?: string;
  bucketName?: string;
  createDeploymentUser?: boolean;
}

export class CloudfrontServedS3Bucket {
  readonly bucket: Bucket
  readonly distribution: Distribution

  constructor(scope: Construct, id: string, props: CloudfrontServedS3BucketProps) {
    const {
      domain,
      certificate,
      cname,
      bucketName,
      createDeploymentUser = false,
    } = props

    const domainName = cname ? `${cname}.${domain}` : domain
    const zone = PublicHostedZone.fromLookup(scope, 'Zone', {
      domainName: domain,
    })

    this.bucket = new Bucket(scope, 'Bucket', {
      removalPolicy: RemovalPolicy.RETAIN,
      bucketName,
      publicReadAccess: false,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          id: 'AbortIncompleteMultipartUploadAfter',
        },
      ],
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 300,
        },
      ],
    })

    this.distribution = new Distribution(scope, 'Distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: `${id} Distribution`,
      httpVersion: HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(this.bucket),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: new CachePolicy(scope, 'CachePolicy', {
          comment: `Cache ${id} Bucket`,
          minTtl: Duration.days(30),
          defaultTtl: Duration.days(30),
          maxTtl: Duration.days(30),
          headerBehavior: CacheHeaderBehavior.none(),
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      domainNames: [domainName],
      certificate,
    })

    const record = new ARecord(scope, 'ARecord', {
      zone,
      recordName: cname ? cname : domain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      ttl: Duration.hours(12),
    })

    if (createDeploymentUser) {
      const user = new User(scope, 'DeploymentUser')
      const accessKey = new AccessKey(scope, 'AccessKey', { user })
      this.bucket.grantReadWrite(user)
      this.distribution.grantCreateInvalidation(user)
      new CfnOutput(scope, 'DeploymentUserAccessKeyId', {
        exportName: `${id}:DeploymentUser:AccessKey:Id`,
        value: accessKey.accessKeyId,
      })
      new CfnOutput(scope, 'DeploymentUserSecretKey', {
        exportName: `${id}:DeploymentUser:AccessKey:Secret`,
        value: accessKey.secretAccessKey.unsafeUnwrap(),
      })
    }

    new CfnOutput(scope, 'Url', {
      exportName: `${id}:Url`,
      value: record.domainName,
      description: `${id} url`,
    })
  }
}
