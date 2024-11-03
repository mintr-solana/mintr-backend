import { awscdk } from 'projen'
import { NodePackageManager } from 'projen/lib/javascript'

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.160.0',
  defaultReleaseBranch: 'main',
  name: 'mintr-backend',
  projenrcTs: true,
  packageManager: NodePackageManager.NPM,
  eslint: true,
  deps: [
    '@solana/actions-spec',
    '@solana/actions',
    '@solana/web3.js',
    '@middy/core',
    '@middy/error-logger',
    '@middy/http-error-handler',
    '@middy/http-header-normalizer',
    '@middy/http-router',
    '@middy/http-security-headers',
    '@aws-lambda-powertools/logger',
    'http-errors',
    'aws-lambda',
    'esbuild',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-s3',
    '@aws-sdk/util-dynamodb',
    '@metaplex-foundation/umi',
    '@metaplex-foundation/mpl-core',
    '@metaplex-foundation/umi-bundle-defaults',
    '@metaplex-foundation/umi-web3js-adapters',
    '@metaplex-foundation/mpl-token-metadata',
  ],
  devDeps: [
    '@types/aws-lambda',
    '@types/http-errors',
    'dotenv',
  ],
  depsUpgrade: false,
})
project.addScripts({
  deploy: './scripts/deploy.sh',
})
project.addGitIgnore('.env')
project.addGitIgnore('.cdk.out.json')
project.addGitIgnore('cdk.context.json')
project.eslint?.addRules({
  'semi': ['error', 'never'],
  'comma-dangle': ['error', 'always-multiline'],
})
project.synth()