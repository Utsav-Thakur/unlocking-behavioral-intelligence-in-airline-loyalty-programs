import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { num } from '../utils/formatters';

// Clean gradient from green (#3fb950) -> amber (#d29922) -> red (#f85149)
const COLORS = [
  '#3fb950', // 0-10%
  '#4fc45c', // 10-20%
  '#6ecf6e', // 20-30%
  '#99d675', // 30-40%
  '#c5da64', // 40-50%
  '#d6bd45', // 50-60%
  '#d29922', // 60-70%
  '#e27f31', // 70-80%
  '#ed653e', // 80-90%
  '#f85149'  // 90-100%
];

const ChurnHistogram = ({ members = [], onBucketClick }) => {
  const data = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      name: `${i * 10}-${(i + 1) * 10}%`,
      min: i * 0.1,
      max: (i + 1) * 0.1,
      count: 0
    }));

    members.forEach(m => {
      const risk = m.churnRisk;
      let idx = Math.floor(risk * 10);
      if (idx > 9) idx = 9;
      if (idx < 0) idx = 0;
      buckets[idx].count++;
    });

    return buckets;
  }, [members]);

  const handleBarClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0 && onBucketClick) {
      const { min, max } = state.activePayload[0].payload;
      onBucketClick({ min, max });
    }
  };

  return (
    <div className="w-full h-[260px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onClick={handleBarClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#8b949e" 
            fontSize={10} 
            tickLine={false}
          />
          <YAxis 
            stroke="#8b949e" 
            fontSize={10} 
            tickLine={false}
            tickFormatter={(val) => num(val)}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#161b22', 
              borderColor: '#30363d', 
              borderRadius: 8 
            }}
            cursor={{ fill: '#1c2129', opacity: 0.4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2.5 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip">
                    <p className="font-bold text-accent mb-0.5">{item.name} Churn Risk</p>
                    <p className="font-medium">
                      <span className="text-text-primary font-bold">{num(item.count)}</span> members in range
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index] || '#58a6ff'} 
                className="hover:opacity-85 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChurnHistogram;
