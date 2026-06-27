import React, { useState, useEffect } from 'react';

/**
 * Pure SVG semicircle gauge component for Churn Risk visualization.
 * Animates the needle rotation on mount and smooth transitions on probability updates.
 */
const ChurnGauge = ({ probability = 0.0, size = 140 }) => {
  const [animatedAngle, setAnimatedAngle] = useState(-90); // Start needle pointing left (-90 deg)

  // Clamp probability between 0 and 1
  const clampedProb = Math.max(0, Math.min(1, probability));
  
  // Calculate needle rotation angle (from -90deg to +90deg where 0deg is straight up)
  const targetAngle = (clampedProb - 0.5) * 180;

  useEffect(() => {
    // Animate pointer rotation on mount
    const timer = setTimeout(() => {
      setAnimatedAngle(targetAngle);
    }, 150);
    return () => clearTimeout(timer);
  }, [targetAngle]);

  // Determine risk category color and text
  let riskColor = '#3fb950'; // green
  let riskText = 'Low Risk';
  
  if (clampedProb >= 0.7) {
    riskColor = '#f85149'; // red
    riskText = 'High Risk';
  } else if (clampedProb >= 0.4) {
    riskColor = '#d29922'; // amber
    riskText = 'Medium Risk';
  }

  // Semicircle dimensions: viewbox: 0 0 200 120, center (100, 100), radius 75
  const cx = 100;
  const cy = 100;
  const r = 75;

  return (
    <div 
      className="flex flex-col items-center justify-center select-none"
      style={{ width: size, height: size * 0.85 }}
    >
      <svg 
        viewBox="0 0 200 125" 
        className="w-full h-full overflow-visible"
      >
        {/* Semicircle background base path */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#30363d"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Green Zone (180deg to 108deg -> 0% to 40% of arc) */}
        {/* End of green: cos(108) = -0.3090, sin(108) = 0.9510. x = 100 + 75*(-0.3090) = 76.8, y = 100 - 75*(0.9510) = 28.7 */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 76.8 28.7`}
          fill="none"
          stroke="#3fb950"
          strokeWidth="12"
          strokeLinecap="square"
        />

        {/* Amber Zone (108deg to 54deg -> 40% to 70% of arc) */}
        {/* End of amber: cos(54) = 0.5878, sin(54) = 0.8090. x = 100 + 75*(0.5878) = 144.1, y = 100 - 75*(0.8090) = 39.3 */}
        <path
          d="M 76.8 28.7 A 75 75 0 0 1 144.1 39.3"
          fill="none"
          stroke="#d29922"
          strokeWidth="12"
          strokeLinecap="square"
        />

        {/* Red Zone (54deg to 0deg -> 70% to 100% of arc) */}
        <path
          d={`M 144.1 39.3 A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#f85149"
          strokeWidth="12"
          strokeLinecap="square"
        />

        {/* Needle Pointer */}
        <g 
          style={{
            transform: `rotate(${animatedAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 1s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          {/* Needle Line */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 68}
            stroke="#e6edf3"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Tip highlight */}
          <circle
            cx={cx}
            cy={cy - 64}
            r="3"
            fill={riskColor}
          />
        </g>

        {/* Center Needle Caps */}
        <circle cx={cx} cy={cy} r="12" fill="#161b22" />
        <circle cx={cx} cy={cy} r="6" fill="#e6edf3" />

        {/* Typography */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="#e6edf3"
          className="font-bold font-display"
          fontSize="24"
        >
          {Math.round(clampedProb * 100)}%
        </text>

        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill={riskColor}
          className="font-semibold"
          fontSize="11"
        >
          {riskText.toUpperCase()}
        </text>
      </svg>
    </div>
  );
};

export default ChurnGauge;
