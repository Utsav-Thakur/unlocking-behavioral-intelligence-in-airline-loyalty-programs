import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  Brush, 
  ResponsiveContainer 
} from 'recharts';
import { num } from '../utils/formatters';

const FlightTrendChart = ({ data = [], onPointClick }) => {
  // Format dates for better display labels
  const formattedData = React.useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return data.map(item => {
      const parts = item.label.split('-');
      let displayLabel = item.label;
      if (parts.length === 2) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          displayLabel = `${monthNames[monthIdx]} ${year}`;
        }
      }
      return {
        ...item,
        displayLabel
      };
    });
  }, [data]);

  // Determine standard reference values based on data range
  const { peakVal, lowVal } = React.useMemo(() => {
    if (data.length === 0) return { peakVal: 32000, lowVal: 12000 };
    const flights = data.map(d => d.flights);
    const maxVal = Math.max(...flights);
    const minVal = Math.min(...flights);
    const range = maxVal - minVal;
    return {
      peakVal: Math.round(maxVal - range * 0.1),
      lowVal: Math.round(minVal + range * 0.1)
    };
  }, [data]);

  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0 && onPointClick) {
      onPointClick(state.activePayload[0].payload);
    }
  };

  return (
    <div className="w-full h-[300px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={formattedData} 
          margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
          onClick={handleChartClick}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="colorFlights" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.01}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          
          <XAxis 
            dataKey="displayLabel" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false} 
          />
          
          <YAxis 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false}
            tickFormatter={(val) => num(val)}
          />

          <Tooltip
            contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                // Calculate percentage change from prior month
                const idx = formattedData.findIndex(d => d.label === item.label);
                let pctChangeText = '—';
                
                if (idx > 0 && formattedData[idx - 1].flights > 0) {
                  const prev = formattedData[idx - 1].flights;
                  const diff = ((item.flights - prev) / prev) * 100;
                  pctChangeText = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
                }

                return (
                  <div className="p-2.5 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip space-y-1">
                    <p className="font-bold text-accent">{item.displayLabel}</p>
                    <p>Booked Flights: <span className="font-bold text-text-primary">{num(item.flights)}</span></p>
                    <p>MoM Change: <span className={`font-semibold ${pctChangeText.startsWith('+') ? 'text-success' : pctChangeText === '—' ? 'text-text-secondary' : 'text-danger'}`}>{pctChangeText}</span></p>
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Reference Lines representing Peak and Low season indicators */}
          <ReferenceLine 
            y={peakVal} 
            stroke="#3fb950" 
            strokeDasharray="4 4"
            label={{ value: 'Peak Season', position: 'top', fill: '#3fb950', fontSize: 9, fontWeight: 500 }} 
          />
          
          <ReferenceLine 
            y={lowVal} 
            stroke="#f85149" 
            strokeDasharray="4 4"
            label={{ value: 'Low Season', position: 'bottom', fill: '#f85149', fontSize: 9, fontWeight: 500 }} 
          />

          {/* Booking Area */}
          <Area 
            type="monotone" 
            dataKey="flights" 
            stroke="#58a6ff" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorFlights)"
            cursor="pointer"
          />

          {/* Brush Zoom component */}
          <Brush 
            dataKey="displayLabel" 
            height={20} 
            stroke="#30363d" 
            fill="#161b22" 
            tickFormatter={() => ''}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FlightTrendChart;
