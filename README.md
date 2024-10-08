# Overview
This repo contains the Mintr infra & backend code that currently invokes the Solana core token program.
In the future we will also be using it to invoke our [custom written program](https://github.com/mintr-solana/mintr-solana) for logic that includes creating collections and minting from the created collections.

Most of the backend logic will be used to allow our users on Twitter/X to interact with us using blinks. Therefore the backend code lives inside lambdas instead of traditional backend servers.

## Usage

### Configuration

Copy the .env.example and fill with your own environment variables:

```
CDK_ACCOUNT=someAwsAccount
CDK_REGION=us-east-1
DOMAIN=mintr.click
AWS_PROFILE=mintr
SOLANA_RPC_NODE=https://your-solana-node
```

### Deployment

Execute following command to deploy:

```bash
npm run deploy
```
