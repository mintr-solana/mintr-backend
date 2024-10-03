#!/bin/bash

set -e

GREEN="\033[32m"
YELLOW="\033[33;1m"
ENDCOLOR="\033[0m"

echo "######"
echo -e "# Deploy ${YELLOW}Mintr${ENDCOLOR}"
echo
echo -e "# Load AWS_PROFILE from ${YELLOW}.env${ENDCOLOR}"
source .env
export AWS_PROFILE
echo -e "# AWS_PROFILE: ${YELLOW}${AWS_PROFILE}${ENDCOLOR}"
echo
npx cdk deploy --all --profile "${AWS_PROFILE}" --outputs-file ".cdk.out.json"