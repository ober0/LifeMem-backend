#!/bin/sh
set -e
npm run migrate:reset
npm run migrate:apply
npm run generate:prisma
npm run seed
npm run prod
