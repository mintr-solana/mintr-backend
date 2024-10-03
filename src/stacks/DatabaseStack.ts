import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export interface DatabaseStackProps extends StackProps {
  tableName: string;
}

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props)

    const { tableName } = props

    const table = new Table(this, 'Table', {
      tableName,
      partitionKey: {
        type: AttributeType.STRING,
        name: 'key',
      },
      encryption: TableEncryption.AWS_MANAGED,
      writeCapacity: 12,
      readCapacity: 12,
      billingMode: BillingMode.PROVISIONED,
      timeToLiveAttribute: 'ttl',
    })

    new CfnOutput(this, 'TableArn', {
      value: table.tableArn,
      exportName: `${id}:Table:Arn`,
    })
  }
}