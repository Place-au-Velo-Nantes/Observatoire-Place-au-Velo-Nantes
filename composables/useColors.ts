import config from '~/config.json';

// Single source of truth for cycloscore colors
export const CYCLOSCORE_COLORS = {
  A: '#5F9642',
  B: '#86B346',
  C: '#CAD24D',
  D: '#FBEF5C',
  E: '#F4CD51',
  'A+': '#5F9642', // Same as A
  UNKNOWN: '#9CA3AF', // Gray for "Non renseigné"
} as const;

// Array of all cycloscore color values (for checking if a color is a cycloscore color)
export const CYCLOSCORE_COLOR_VALUES = Object.values(CYCLOSCORE_COLORS);

export const useColors = () => {
  function getLineColor(line: string): string {
    const black = '#000000';
    const lineConfig = config.colors.find((color) => color.line === line);
    if (!lineConfig) {
      return black;
    }
    return lineConfig.color;
  }

  function getLines(): string[] {
    return config.colors.map((color) => color.line);
  }

  function getCycloscoreColor(cycloscore: string | null | undefined): string {
    if (!cycloscore) {
      return CYCLOSCORE_COLORS.UNKNOWN;
    }

    // Extract the first letter and handle A+
    const trimmed = cycloscore.trim().toUpperCase();
    const letter = trimmed.startsWith('A+') ? 'A+' : trimmed.charAt(0);

    return CYCLOSCORE_COLORS[letter as keyof typeof CYCLOSCORE_COLORS] || CYCLOSCORE_COLORS.UNKNOWN;
  }

  return { getLineColor, getLines, getCycloscoreColor };
};
