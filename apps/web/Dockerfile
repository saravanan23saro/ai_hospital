FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json next-env.d.ts ./
RUN npm ci
COPY app ./app
COPY public ./public
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk upgrade --no-cache
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["npm", "start"]
