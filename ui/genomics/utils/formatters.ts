export const formatCoordinate = (chr: string, pos: number): string => {
  return `${chr}:${pos.toLocaleString()}`;
};

export const formatAlleleFrequency = (freq: number): string => {
  if (freq === 0) return '0.00%';
  if (freq < 0.0001) return freq.toExponential(3);
  return `${(freq * 100).toFixed(4)}%`;
};

export const formatHgvs = (hgvsC: string, hgvsP: string): string => {
  if (!hgvsC && !hgvsP) return 'N/A';
  return `${hgvsC} (${hgvsP})`;
};

export const getPathogenicityColor = (status: string): string => {
  switch (status) {
    case 'Pathogenic':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'Likely Pathogenic':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case 'VUS':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'Likely Benign':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'Benign':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
};