import * as path from 'path'
import { CfnOutput, Duration, Fn, Stack, StackProps } from 'aws-cdk-lib'
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { Construct } from 'constructs'

export interface ActionsStackProps extends StackProps {
  domain: string;
  cname: string;
  certificateArn: string;
}

export class ActionsStack extends Stack {
  constructor(scope: Construct, id: string, props: ActionsStackProps) {
    super(scope, id, props)

    const {
      certificateArn,
      domain,
      cname,
    } = props

    const domainName = `${cname}.${domain}`

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', certificateArn)
    const zone = PublicHostedZone.fromLookup(this, 'Zone', {
      domainName: domain,
    })
    const tableArn = Fn.importValue('KeyData:Table:Arn')
    const table = Table.fromTableArn(this, 'Table', tableArn)

    const lambda = new NodejsFunction(this, 'ActionsHandler', {
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(5),
      architecture: Architecture.ARM_64,
      description: `Handler function for the ${id} actions`,
      memorySize: 256,
      functionName: `${id}Actions`,
      entry: path.join(__dirname, '../lambda/actions.ts'),
      logRetention: RetentionDays.TWO_WEEKS,
      environment: {
        TABLE_NAME: table.tableName,
      },
      handler: 'handler',
      bundling: {
        externalModules: ['@aws-sdk'],
        minify: true,
      },
    })
    table.grantReadWriteData(lambda)

    const api = new HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowHeaders: ['authorization'],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.HEAD,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
        maxAge: Duration.days(10),
      },
      defaultIntegration: new HttpLambdaIntegration(`${id}ActionsApiIntegration`, lambda),
    })

    const distribution = new Distribution(this, 'Distribution', {
      certificate,
      comment: `${id} distribution to serve actions API`,
      defaultBehavior: {
        origin: new HttpOrigin(`${api.apiId}.execute-api.${this.region}.amazonaws.com`, {
          protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
          readTimeout: Duration.minutes(1),
        }),
        cachePolicy: CachePolicy.CACHING_DISABLED,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        compress: false,
      },
      domainNames: [domainName],
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
    })

    const aRecord = new ARecord(this, 'ARecord', {
      zone,
      recordName: cname,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      ttl: Duration.hours(12),
    })

    new CfnOutput(this, 'ApiUrl', {
      value: aRecord.domainName,
      exportName: 'Mintr:Api:Url',
      description: `${id} api url`,
    })
  }
}