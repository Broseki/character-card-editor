FROM dhi.io/node:24-alpine3.23-sfw-dev AS build

WORKDIR /app

COPY package*.json ./
RUN sfw npm ci

COPY . .
RUN sfw npm run build

RUN sfw npm i --no-save --prefix /opt/serve-pkg sirv-cli

FROM dhi.io/node:24-alpine3.23 AS runtime

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /opt/serve-pkg/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "node_modules/sirv-cli/bin.js", "dist", "--single", "--host", "0.0.0.0", "--port", "3000"]
