#!/bin/sh
set -e
npm run migrate:deploy
npm run generate
npm run seed
npm run prod
