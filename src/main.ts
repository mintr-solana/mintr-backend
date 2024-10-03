import { App, Environment } from 'aws-cdk-lib'
import { configDotenv } from 'dotenv'
import { ActionsStack } from './stacks/ActionsStack'
import { CertificateStack } from './stacks/CertificateStack'
import { DatabaseStack } from './stacks/DatabaseStack'
import { getMandatoryEnv } from './utils/getMandatoryEnv'

configDotenv()

const config = {
  account: getMandatoryEnv('CDK_ACCOUNT'),
  region: getMandatoryEnv('CDK_REGION'),
  domain: getMandatoryEnv('DOMAIN'),
}

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

const actionsStack = new ActionsStack(app, 'ActionsStack', {
  domain: config.domain,
  cname: 'actions',
  certificateArn: certificateStack.certificate.certificateArn,
  crossRegionReferences: true,
  env,
})
actionsStack.addDependency(keyDatabase)

app.synth()