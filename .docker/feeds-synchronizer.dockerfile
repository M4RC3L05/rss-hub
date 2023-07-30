FROM docker.io/node:18.17-alpine as build

WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./

COPY --chown=node:node ./src/common ./src/common
COPY --chown=node:node ./src/database ./src/database
COPY --chown=node:node ./src/apps/feeds-synchronizer ./src/apps/feeds-synchronizer
COPY --chown=node:node ./.swcrc ./.swcrc

RUN npm ci

RUN npx swc --copy-files --include-dotfiles ./src -d dist

FROM docker.io/node:18.17-alpine as final

USER node

WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./

RUN npm ci --omit=dev

COPY --from=build --chown=node:node /home/node/app/dist ./src

COPY --chown=node:node ./config ./config
COPY --chown=node:node ./data ./data

VOLUME [ "/home/node/app/data" ]

CMD ["node", "src/apps/feeds-synchronizer/main.js"]
