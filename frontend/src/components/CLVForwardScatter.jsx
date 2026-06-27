import React, { useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { currency } from '../utils/formatters';

const CustomDot = (props) => {
  const { cx, cy, fill, onClick, payload } = props;
  if (!cx || !cy) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={fill}
      fillOpacity={0.75}
      stroke={fill}
      strokeWidth={0.5}
      className="cursor-pointer transition-all duration-150 ease-in-out hover:r-[7px] hover:fill-opacity-100"
      onClick={() => onClick && onClick(payload)}
    />
  );
};

const CLVForwardScatter = ({ members = [], colorBy = 'clv_status', onDotClick }) => {
  // Sample and derive projected forward scores
  const sampledData = useMemo(() => {
    if (!members || members.length === 0) return [];
    
    // Sample active members with valid profiles
    const active = members.filter(m => !m.cancellationYear && m.salary !== null);
    const subset = active.slice(0, 200);

    return subset.map(m => {
      // Forward score = clv * (1.15 - risk * 0.9)
      // High churn risk reduces projected forward value significantly
      const forwardScore = Math.round(m.clv * (1.15 - m.churnRisk * 0.9));
      const ratio = forwardScore / m.clv;
      
      let status = 'Accurate';
      let color = '#58a6ff'; // blue
      
      if (ratio > 1.04) {
        status = 'Underestimated';
        color = '#3fb950'; // green
      } else if (ratio < 0.88) {
        status = 'Overestimated';
        color = '#f85149'; // red
      }

      return {
        ...m,
        forwardScore,
        ratio,
        status,
        color
      };
    });
  }, [members]);

  // Calculate dynamic medians for grid partitioning
  const medians = useMemo(() => {
    if (sampledData.length === 0) return { clv: 7500, forward: 7000 };
    
    const clvValues = [...sampledData].map(d => d.clv).sort((a, b) => a - b);
    const forwardValues = [...sampledData].map(d => d.forwardScore).sort((a, b) => a - b);
    
    return {
      clv: clvValues[Math.floor(clvValues.length / 2)],
      forward: forwardValues[Math.floor(forwardValues.length / 2)]
    };
  }, [sampledData]);

  // Split into Recharts Scatter Series
  const series = useMemo(() => {
    if (colorBy === 'segment') {
      return [
        { name: 'Elite Loyalists', data: sampledData.filter(d => d.segment === 'Elite Loyalists'), color: '#58a6ff' },
        { name: 'At-Risk Flyers', data: sampledData.filter(d => d.segment === 'At-Risk Flyers'), color: '#f85149' },
        { name: 'Casual Travelers', data: sampledData.filter(d => d.segment === 'Casual Travelers'), color: '#d29922' },
        { name: 'Standard Members', data: sampledData.filter(d => d.segment === 'Standard Members'), color: '#8b949e' }
      ];
    }
    return [
      { name: 'Underestimated (Green)', data: sampledData.filter(d => d.status === 'Underestimated'), color: '#3fb950' },
      { name: 'Accurate (Blue)', data: sampledData.filter(d => d.status === 'Accurate'), color: '#58a6ff' },
      { name: 'Overestimated (Red)', data: sampledData.filter(d => d.status === 'Overestimated'), color: '#f85149' }
    ];
  }, [sampledData, colorBy]);

  const handleDotClick = (payload) => {
    if (onDotClick && payload) {
      onDotClick(payload);
    }
  };

  return (
    <div className="relative select-none w-full h-[300px]">
      
      {/* Quadrant HUD Overlays */}
      <div className="absolute top-9 left-16 pointer-events-none select-none text-[9px] uppercase font-bold tracking-wider text-success border border-success/20 bg-success/5 px-2 py-1 rounded">
        Hidden Gems
      </div>
      <div className="absolute top-9 right-4 pointer-events-none select-none text-[9px] uppercase font-bold tracking-wider text-accent border border-accent/20 bg-accent/5 px-2 py-1 rounded">
        True High Value
      </div>
      <div className="absolute bottom-16 left-16 pointer-events-none select-none text-[9px] uppercase font-bold tracking-wider text-text-secondary border border-border bg-card/60 px-2 py-1 rounded">
        Low Priority
      </div>
      <div className="absolute bottom-16 right-4 pointer-events-none select-none text-[9px] uppercase font-bold tracking-wider text-danger border border-danger/20 bg-danger/5 px-2 py-1 rounded">
        CLV Risk
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 25, right: 10, left: -5, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          
          <XAxis 
            type="number" 
            dataKey="clv" 
            name="Historical CLV" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false}
            tickFormatter={(val) => `$${Math.round(val/1000)}k`}
            label={{ value: 'Historical CLV ($)', position: 'bottom', offset: -4, fill: '#8b949e', fontSize: 10 }}
          />
          
          <YAxis 
            type="number" 
            dataKey="forwardScore" 
            name="Forward CLV Score" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false}
            tickFormatter={(val) => `$${Math.round(val/1000)}k`}
            label={{ value: 'Projected Forward CLV Score ($)', angle: -90, position: 'left', offset: 0, fill: '#8b949e', fontSize: 10 }}
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
                    <p>Historical CLV: <span className="font-semibold text-text-primary">{currency(item.clv)}</span></p>
                    <p>Projected CLV: <span className="font-semibold text-success">{currency(item.forwardScore)}</span></p>
                    <p>Projection Status: <span className="font-semibold" style={{ color: item.color }}>{item.status}</span></p>
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
            wrapperStyle={{ fontSize: 9, color: '#e6edf3' }}
          />

          {/* Median cross-hairs */}
          <ReferenceLine 
            x={medians.clv} 
            stroke="#30363d" 
            strokeWidth={1.5}
            strokeDasharray="4 4" 
          />
          <ReferenceLine 
            y={medians.forward} 
            stroke="#30363d" 
            strokeWidth={1.5}
            strokeDasharray="4 4" 
          />

          {/* Render 3 status series */}
          {series.map((s) => (
            <Scatter
              key={s.name}
              name={s.name}
              data={s.data}
              fill={s.color}
              shape={<CustomDot onClick={handleDotClick} />}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CLVForwardScatter;
