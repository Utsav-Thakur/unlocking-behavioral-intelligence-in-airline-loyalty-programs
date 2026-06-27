// formatters.js

export const currency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const pct = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  // Handle both 0.75 and 75 as input.
  const numeric = parseFloat(value);
  const formatted = numeric <= 1.0 ? numeric * 100 : numeric;
  return `${formatted.toFixed(1)}%`;
};

export const num = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-CA').format(value);
};

export const riskColor = (risk) => {
  if (risk === null || risk === undefined) return '#8b949e'; // text-secondary
  if (risk >= 0.7) return '#f85149'; // danger
  if (risk >= 0.3) return '#d29922'; // warning
  return '#3fb950'; // success
};

export const riskClass = (risk) => {
  if (risk === null || risk === undefined) return 'badge-low';
  if (risk >= 0.7) return 'badge-high';
  if (risk >= 0.3) return 'badge-medium';
  return 'badge-low';
};

// 3 segments -> 3 colors (or handles standard categories)
export const segColor = (segment) => {
  switch (segment) {
    case 'Elite Loyalists':
      return '#58a6ff'; // accent
    case 'At-Risk Flyers':
      return '#f85149'; // danger
    case 'Casual Travelers':
      return '#d29922'; // warning
    case 'Standard Members':
      return '#e6edf3'; // text-primary
    default:
      return '#8b949e'; // text-secondary
  }
};

// 3 CLV statuses -> 3 colors
export const clvColor = (status) => {
  switch (status) {
    case 'High':
      return '#58a6ff'; // accent / blue
    case 'Medium':
      return '#d29922'; // warning / orange
    case 'Low':
      return '#f85149'; // danger / red
    default:
      return '#8b949e';
  }
};
