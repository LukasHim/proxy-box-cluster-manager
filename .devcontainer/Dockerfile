FROM node:lts

RUN apt-get update && apt-get install -y \
  git \
  curl \
  build-essential

# yarn
RUN corepack enable

# wrangler
RUN npm i -g wrangler

WORKDIR /workspace
