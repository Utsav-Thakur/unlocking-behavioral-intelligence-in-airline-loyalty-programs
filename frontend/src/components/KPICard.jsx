import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Reusable KPI Card component.
 * Animates numeric values on mount using requestAnimationFrame.
 */
const KPICard = ({ 
  title, 
  value, 
  sub, 
  icon: Icon, 
  color = 'accent', 
  loading = false, 
  trend = null, // '+', '-', or null
  delta = null,  // trend text (e.g. '12.5%')
  formatter = (val) => val
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    // Parse numeric target
    let target = 0;
    if (typeof value === 'number') {
      target = value;
    } else if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      target = isNaN(parsed) ? 0 : parsed;
    }

    if (target === 0) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 800; // Animation duration in ms
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = easeProgress * (target - start) + start;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value); // Ensure exact final value is set (handles format/strings)
      }
    };

    requestAnimationFrame(animate);
  }, [value, loading]);

  if (loading) {
    return (
      <div className="card p-5 space-y-4 animate-pulse select-none min-h-[120px] flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="h-3.5 bg-border rounded w-1/2"></div>
          <div className="h-5 bg-border rounded-full w-5"></div>
        </div>
        <div className="space-y-2">
          <div className="h-7 bg-border rounded w-2/3"></div>
          <div className="h-3 bg-border rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Determine text-color mapping
  const colorClasses = {
    accent: 'text-accent',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    secondary: 'text-text-secondary'
  };

  const selectedColor = colorClasses[color] || 'text-accent';

  // Format values
  const formattedValue = typeof value === 'number' ? formatter(displayValue) : displayValue;

  return (
    <div className="card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-transform duration-200 hover:-translate-y-0.5 count-up select-none">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</span>
        {Icon && <Icon className={`h-5 w-5 ${selectedColor}`} />}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-text-primary font-display tracking-tight">
          {formattedValue}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          {trend === '+' && (
            <span className="text-success text-[11px] font-semibold flex items-center">
              ▲ {delta}
            </span>
          )}
          {trend === '-' && (
            <span className="text-danger text-[11px] font-semibold flex items-center">
              ▼ {delta}
            </span>
          )}
          <span className="text-[11px] text-text-secondary">{sub}</span>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
