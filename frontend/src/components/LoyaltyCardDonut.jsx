import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { num, pct } from '../utils/formatters';

const LoyaltyCardDonut = ({ members = [], onSliceClick }) => {
  const { chartData, total } = useMemo(() => {
    if (members && members.length > 0) {
      const counts = { Star: 0, Nova: 0, Aurora: 0 };
      members.forEach(m => {
        if (counts[m.card] !== undefined) {
          counts[m.card]++;
        }
      });
      const sum = members.length;
      return {
        total: sum,
        chartData: [
          { name: 'Aurora', value: counts.Aurora, color: '#3fb950' }, // Gold / green
          { name: 'Nova', value: counts.Nova, color: '#58a6ff' },    // Silver / accent
          { name: 'Star', value: counts.Star, color: '#8b949e' }     // Standard / grey
        ]
      };
    }

    // Default fallback values
    return {
      total: 16737,
      chartData: [
        { name: 'Aurora', value: 3429, color: '#3fb950' },
        { name: 'Nova', value: 5671, color: '#58a6ff' },
        { name: 'Star', value: 7637, color: '#8b949e' }
      ]
    };
  }, [members]);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
    const RADIAN = Math.PI / 180;
    // Push labels further outside the outer radius (outerRadius + 15)
    const radius = outerRadius + 12;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#8b949e"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="9"
        fontWeight="500"
      >
        {`${payload.name}: ${pct(percent)}`}
      </text>
    );
  };

  const handlePieClick = (state) => {
    if (state && onSliceClick) {
      onSliceClick(state.name);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center select-none w-full h-full min-h-[240px]">
      
      {/* Center text absolute overlay */}
      <div className="absolute top-[38%] flex flex-col items-center justify-center pointer-events-none text-center select-none">
        <span className="text-[10px] tracking-wider uppercase font-bold text-text-secondary">Card Tiers</span>
        <span className="text-sm font-extrabold text-text-primary mt-0.5">{num(total)}</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
            onClick={handlePieClick}
            cursor="pointer"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                className="hover:opacity-90 transition-opacity duration-150"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip">
                    <p className="font-bold" style={{ color: item.color }}>{item.name} Members</p>
                    <p className="font-semibold">{num(item.value)} passengers</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend list below */}
      <div className="flex gap-4 text-[10px] mt-2 justify-center flex-wrap">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}: <strong className="text-text-primary">{num(entry.value)}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoyaltyCardDonut;
