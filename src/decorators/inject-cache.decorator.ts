import { Inject } from '@nestjs/common';
import { TTL_CACHE } from '../constants';

export const InjectCache = (): ReturnType<typeof Inject> => Inject(TTL_CACHE);
