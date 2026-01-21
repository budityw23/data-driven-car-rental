export const formatUtils = {
  formatCurrency: (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  formatNumber: (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  },
  
  formatPercentage: (value: number) => {
    return `${value.toFixed(1)}%`;
  }
};
