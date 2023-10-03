FROM node:20.6.1 as builder
ADD public /opt/public
ADD src /opt/src
ADD package.json /opt/package.json
ADD rollup.config.js /opt/rollup.config.js
ADD tsconfig.json /opt/tsconfig.json
ADD yarn.lock /opt/yarn.lock
ADD .env /opt/.env
WORKDIR /opt
RUN yarn && yarn build

FROM nginx:latest
COPY --from=builder /opt/public /usr/share/nginx/html
