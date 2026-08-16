import { randomInt } from 'crypto';

export const generateCode = () => randomInt(100000, 1000000).toString();
