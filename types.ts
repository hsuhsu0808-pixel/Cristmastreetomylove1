
export enum ParticleShape {
  CONE = 'CONE',
  HEART = 'HEART',
  SNOWFLAKE = 'SNOWFLAKE',
  STAR = 'STAR',
  FIREWORKS = 'FIREWORKS'
}

export type GestureType = 'NONE' | 'FIST' | 'OPEN' | 'PINCH' | 'ROTATION';

export interface ParticleConfig {
  shape: ParticleShape;
  color1: string;
  color2: string;
  particleCount: number;
}
