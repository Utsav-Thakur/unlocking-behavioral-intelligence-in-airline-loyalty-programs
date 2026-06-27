import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { num } from '../utils/formatters';

const ProvinceBarChart = ({ members = [], data = [], onBarClick }) => {
  // Aggregate count and calculate churn rate dynamically from members if provided,
  // or fall back to data prop
  const chartData = useMemo(() => {
    if (members && members.length > 0) {
      const provMap = {};
      members.forEach(m => {
        const prov = m.province;
        if (!provMap[prov]) {
          provMap[prov] = { province: prov, count: 0, cancelled: 0 };
        }
        provMap[prov].count++;
        if (m.cancellationYear) {
          provMap[prov].cancelled++;
        }
      });

      return Object.values(provMap)
        .map(p => ({
          province: p.province,
          count: p.count,
          // Churn rate as a percentage value (0-100)
          churnRate: Math.round((p.cancelled / p.count) * 1000) / 10
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }
    
    if (data && data.length > 0) {
      return [...data].sort((a, b) => b.count - a.count).slice(0, 8);
    }

    return [];
  }, [members, data]);

  const handleChartClick = (state) => {
    if (state && state.activeLabel && onBarClick) {
      onBarClick(state.activeLabel);
    }
  };

  return (
    <div className="w-full h-[260px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
          
          {/* Category Y Axis (Provinces) */}
          <YAxis 
            type="category" 
            dataKey="province" 
            stroke="#8b949e" 
            fontSize={10} 
            tickLine={false} 
            width={85}
          />
          
          {/* Primary X Axis (Count - Bottom) */}
          <XAxis 
            type="number" 
            xAxisId="count" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false}
            tickFormatter={(val) => num(val)}
          />
          
          {/* Secondary X Axis (Churn Rate % - Top) */}
          <XAxis 
            type="number" 
            xAxisId="churn" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false} 
            orientation="top" 
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
          />

          <Tooltip 
            contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8 }}
            cursor={{ fill: '#1c2129', opacity: 0.4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2.5 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip space-y-1">
                    <p className="font-bold text-accent">{item.province}</p>
                    <p>Total Members: <span className="font-semibold text-text-primary">{num(item.count)}</span></p>
                    <p>Cancellation Rate: <span className="font-semibold text-danger">{item.churnRate}%</span></p>
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Bar for passenger count (mapped to bottom XAxis) */}
          <Bar 
            dataKey="count" 
            fill="#58a6ff" 
            xAxisId="count" 
            radius={[0, 4, 4, 0]} 
            barSize={12}
            cursor="pointer"
          />

          {/* Line for churn rate (mapped to top XAxis) */}
          <Line 
            type="monotone" 
            dataKey="churnRate" 
            stroke="#f85149" 
            strokeWidth={2.5} 
            xAxisId="churn"
            dot={{ fill: '#0d1117', stroke: '#f85149', strokeWidth: 1.5, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProvinceBarChart;
