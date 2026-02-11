FROM node:24-alpine AS build

WORKDIR /app
COPY ./ .

RUN yarn install && \
    yarn build

FROM node:24-alpine AS serve

WORKDIR /app
COPY --from=build /app/build .

RUN apk add --no-cache python3

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/ytdl \
    && chmod a+rx /usr/local/bin/ytdl

ENTRYPOINT ["node", "index.js"]
