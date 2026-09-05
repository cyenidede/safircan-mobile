export const colors = {
  background: '#F7F3EA',
  surface: '#FFFCF6',
  navy: '#101D3A',
  sapphire: '#1557A0',
  sapphireSoft: '#E7EFF9',
  muted: '#687083',
  border: '#DDD7CA',
  white: '#FFFFFF',
  danger: '#A33131',
  gold: '#A4772B',
} as const;

export const darkColors = { ...colors, background: '#0D1424', surface: '#151F32', navy: '#F4F7FC', muted: '#AEB8CA', border: '#2B3950', sapphireSoft: '#1D3553' } as const;

export const layout = {
  screenPadding: 20,
  radius: 20,
  controlHeight: 56,
} as const;
