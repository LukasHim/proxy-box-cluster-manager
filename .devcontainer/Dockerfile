FROM node:lts

# 基础工具
RUN apt-get update && apt-get install -y \
  git \
  curl \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*

# yarn
RUN corepack enable

# wrangler
RUN npm i -g wrangler

WORKDIR /workspace
