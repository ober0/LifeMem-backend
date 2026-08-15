#!/bin/sh
set -e
npm run migrate:apply
npm run generate
npm run seed
npm run prod
