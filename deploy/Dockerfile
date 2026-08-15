# Build stage
FROM node:22-slim AS build

WORKDIR /opt/app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run generate
RUN npm run build


# Production stage
FROM node:22-slim AS production

WORKDIR /opt/app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /opt/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /opt/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/prisma ./prisma
COPY --from=build /opt/app/src/translations ./dist/translations
COPY --from=build /opt/app/deploy/startup.sh ./startup.sh
RUN sed -i 's/\r$//' /opt/app/startup.sh && chmod +x /opt/app/startup.sh

EXPOSE 3000

CMD ["sh", "/opt/app/startup.sh"]
