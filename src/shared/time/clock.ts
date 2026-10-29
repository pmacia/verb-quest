import type {Clock} from '../domain/types';
export const systemClock:Clock={now:()=>new Date().toISOString()};
