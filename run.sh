#!/bin/bash

WORKDIR=$PWD
INDEXER=${1:-framework}
cd $WORKDIR && \

echo "NODE_ENV=production node packages/core/dist/config.js setup"
ENVS=$(NODE_ENV=production node packages/core/dist/config.js setup)

while IFS= read -r env; do
    export "${env//\"/}";
done <<< "$ENVS"

echo "NODE_ENV=production node $NODE_OPTIONS packages/${INDEXER}/dist/run.js" 
cd $WORKDIR && NODE_ENV=production node $NODE_OPTIONS packages/${INDEXER}/dist/run.js
