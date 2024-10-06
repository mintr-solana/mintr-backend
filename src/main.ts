import { App, Environment } from 'aws-cdk-lib'
import { configDotenv } from 'dotenv'
import { ActionsStack } from './stacks/ActionsStack'
import { AssetStack } from './stacks/AssetStack'
import { CertificateStack } from './stacks/CertificateStack'
import { DatabaseStack } from './stacks/DatabaseStack'
import { getMandatoryEnv } from './utils/getMandatoryEnv'

configDotenv()

const config = {
  account: getMandatoryEnv('CDK_ACCOUNT'),
  region: getMandatoryEnv('CDK_REGION'),
  domain: getMandatoryEnv('DOMAIN'),
  solanaRpcNode: getMandatoryEnv('SOLANA_RPC_NODE'),
}

const assetCname = 'assets'

const app = new App()
const env: Environment = {
  account: config.account,
  region: config.region,
}

const keyDatabase = new DatabaseStack(app, 'KeyData', {
  tableName: 'mintr.keys',
  env,
})

const certificateStack = new CertificateStack(app, 'CertificateStack', {
  domain: config.domain,
  env: {
    account: env.account,
    region: 'us-east-1',
  },
  crossRegionReferences: true,
})

const assetStack = new AssetStack(app, 'AssetStack', {
  domain: config.domain,
  cname: assetCname,
  certificateArn: certificateStack.certificateArn,
  crossRegionReferences: true,
  env,
})

const actionsStack = new ActionsStack(app, 'ActionsStack', {
  domain: config.domain,
  cname: 'actions',
  certificateArn: certificateStack.certificate.certificateArn,
  crossRegionReferences: true,
  solanaRpcNode: config.solanaRpcNode,
  bucket: assetStack.bucket,
  assetCname: assetCname,
  env,
})
actionsStack.addDependency(keyDatabase)

app.synth()