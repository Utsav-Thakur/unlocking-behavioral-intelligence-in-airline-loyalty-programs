import React, { useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { currency, pct } from '../utils/formatters';

// Custom dot component to achieve specific radius and hover expansions
const CustomDot = (props) => {
  const { cx, cy, fill, onClick, payload } = props;
  if (!cx || !cy) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={fill}
      fillOpacity={0.7}
      stroke={fill}
      strokeWidth={0.5}
      className="cursor-pointer transition-all duration-150 ease-in-out hover:r-[7px] hover:fill-opacity-100"
      onClick={() => onClick && onClick(payload)}
    />
  );
};

const CLVScatterChart = ({ 
  members = [], 
  colorBy = 'churn_risk', // 'churn_risk' | 'segment' | 'clv_status'
  onDotClick 
}) => {
  // Sample up to 250 active members for performance
  const sampledMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
    
    const active = members.filter(m => !m.cancellationYear);
    if (active.length <= 250) return active;

    // Systematic sampling across the range
    const step = Math.floor(active.length / 250);
    const result = [];
    for (let i = 0; i < active.length && result.length < 250; i += step) {
      result.push(active[i]);
    }
    return result;
  }, [members]);

  // Group sampled members into 3 series based on colorBy criteria
  const seriesData = useMemo(() => {
    const series = {
      group1: { name: '', data: [], color: '#3fb950' },
      group2: { name: '', data: [], color: '#d29922' },
      group3: { name: '', data: [], color: '#f85149' }
    };

    if (colorBy === 'churn_risk') {
      series.group1 = { name: 'Low Risk (<30%)', data: [], color: '#3fb950' };
      series.group2 = { name: 'Medium Risk (30-70%)', data: [], color: '#d29922' };
      series.group3 = { name: 'High Risk (>=70%)', data: [], color: '#f85149' };

      sampledMembers.forEach(m => {
        const risk = m.churnRisk;
        if (risk < 0.3) series.group1.data.push(m);
        else if (risk < 0.7) series.group2.data.push(m);
        else series.group3.data.push(m);
      });
    } else if (colorBy === 'segment') {
      series.group1 = { name: 'Elite Loyalists', data: [], color: '#58a6ff' };
      series.group2 = { name: 'At-Risk Flyers', data: [], color: '#f85149' };
      series.group3 = { name: 'Standard & Casual', data: [], color: '#8b949e' };

      sampledMembers.forEach(m => {
        if (m.segment === 'Elite Loyalists') series.group1.data.push(m);
        else if (m.segment === 'At-Risk Flyers') series.group2.data.push(m);
        else series.group3.data.push(m);
      });
    } else if (colorBy === 'clv_status') {
      series.group1 = { name: 'High CLV (+$10k)', data: [], color: '#58a6ff' };
      series.group2 = { name: 'Medium CLV ($5k-$10k)', data: [], color: '#d29922' };
      series.group3 = { name: 'Low CLV (-$5k)', data: [], color: '#f85149' };

      sampledMembers.forEach(m => {
        if (m.clv >= 10000) series.group1.data.push(m);
        else if (m.clv >= 5000) series.group2.data.push(m);
        else series.group3.data.push(m);
      });
    }

    return Object.values(series);
  }, [sampledMembers, colorBy]);

  const handleDotClick = (payload) => {
    if (onDotClick && payload) {
      onDotClick(payload);
    }
  };

  return (
    <div className="w-full h-[260px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis 
            type="number" 
            dataKey="clv" 
            name="CLV" 
            stroke="#8b949e" 
            fontSize={10} 
            tickLine={false}
            tickFormatter={(val) => `$${Math.round(val/1000)}k`}
            label={{ value: 'Customer Lifetime Value (CAD)', position: 'bottom', offset: -4, fill: '#8b949e', fontSize: 10 }}
          />
          <YAxis 
            type="number" 
            dataKey="churnRisk" 
            name="Churn Risk" 
            stroke="#8b949e" 
            fontSize={10} 
            tickLine={false}
            tickFormatter={(val) => `${Math.round(val * 100)}%`}
            label={{ value: 'Churn Probability (%)', angle: -90, position: 'left', offset: 0, fill: '#8b949e', fontSize: 10 }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: '#30363d' }}
            contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-2.5 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip space-y-1">
                    <p className="font-bold text-accent">Member #{item.loyaltyNumber}</p>
                    <p>CLV: <span className="font-semibold text-text-primary">{currency(item.clv)}</span></p>
                    <p>Churn Risk: <span className="font-semibold text-danger">{pct(item.churnRisk)}</span></p>
                    <p>Segment: <span className="font-semibold text-text-secondary">{item.segment}</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: 10, color: '#e6edf3' }}
          />
          {seriesData.map((series) => (
            <Scatter
              key={series.name}
              name={series.name}
              data={series.data}
              fill={series.color}
              shape={<CustomDot onClick={handleDotClick} />}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CLVScatterChart;
