import React, { useMemo } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Legend, 
  Tooltip,
  ResponsiveContainer 
} from 'recharts';
import { currency, num, pct } from '../utils/formatters';

const SegmentRadarChart = ({ members = [] }) => {
  // Compute segment averages and normalize them on mount
  const radarData = useMemo(() => {
    // Standard baseline if no members are loaded yet
    const defaultData = [
      { axis: 'CLV Score', 'Elite Loyalists': 95, 'At-Risk Flyers': 58, 'Standard Members': 48, raw: { 'Elite Loyalists': '$18,450', 'At-Risk Flyers': '$8,900', 'Standard Members': '$7,200' } },
      { axis: 'Flight Frequency', 'Elite Loyalists': 88, 'At-Risk Flyers': 42, 'Standard Members': 52, raw: { 'Elite Loyalists': '64 flights', 'At-Risk Flyers': '28 flights', 'Standard Members': '35 flights' } },
      { axis: 'Recency (Active)', 'Elite Loyalists': 92, 'At-Risk Flyers': 15, 'Standard Members': 65, raw: { 'Elite Loyalists': '12 days ago', 'At-Risk Flyers': '215 days ago', 'Standard Members': '45 days ago' } },
      { axis: 'Redemption Rate', 'Elite Loyalists': 78, 'At-Risk Flyers': 22, 'Standard Members': 45, raw: { 'Elite Loyalists': '62% redeemed', 'At-Risk Flyers': '18% redeemed', 'Standard Members': '38% redeemed' } },
      { axis: 'Tenure (Years)', 'Elite Loyalists': 82, 'At-Risk Flyers': 60, 'Standard Members': 50, raw: { 'Elite Loyalists': '5.2 yrs avg', 'At-Risk Flyers': '3.8 yrs avg', 'Standard Members': '3.1 yrs avg' } }
    ];

    if (!members || members.length === 0) return defaultData;

    const segmentsToProfile = ['Elite Loyalists', 'At-Risk Flyers', 'Standard Members'];
    const profiles = {};

    segmentsToProfile.forEach(seg => {
      profiles[seg] = {
        clvSum: 0,
        flightsSum: 0,
        redempSum: 0,
        tenureSum: 0,
        recencyScoreSum: 0, // derived from recent flight ratios
        count: 0
      };
    });

    members.forEach(m => {
      if (profiles[m.segment]) {
        const prof = profiles[m.segment];
        prof.clvSum += m.clv;
        prof.flightsSum += m.totalFlights;
        prof.redempSum += m.redemptionRatio;
        
        const tenure = 2018 - m.enrollmentYear;
        prof.tenureSum += tenure;

        // Recency proxy: higher active flights with lower risk -> higher recency score
        const recencyScore = m.totalFlights > 0 ? (1 - m.churnRisk) * 100 : 5;
        prof.recencyScoreSum += recencyScore;
        prof.count++;
      }
    });

    // Calculate averages
    const avgs = {};
    segmentsToProfile.forEach(seg => {
      const p = profiles[seg];
      const count = p.count || 1;
      avgs[seg] = {
        clv: p.clvSum / count,
        flights: p.flightsSum / count,
        redemp: p.redempSum / count,
        tenure: p.tenureSum / count,
        recency: p.recencyScoreSum / count
      };
    });

    // Find min and max across all segments to normalize 10-95
    const dimensions = ['clv', 'flights', 'redemp', 'tenure', 'recency'];
    const minMax = {};
    dimensions.forEach(dim => {
      const vals = segmentsToProfile.map(seg => avgs[seg][dim]);
      minMax[dim] = {
        min: Math.min(...vals),
        max: Math.max(...vals)
      };
    });

    const normalize = (val, dim) => {
      const { min, max } = minMax[dim];
      const range = max - min || 1;
      // Normalizes to 20-95 range
      return Math.round(((val - min) / range) * 75 + 20);
    };

    // Helper to format actual raw values
    const formatRaw = (val, dim) => {
      if (dim === 'clv') return currency(val);
      if (dim === 'flights') return `${val.toFixed(1)} flights`;
      if (dim === 'redemp') return pct(val);
      if (dim === 'tenure') return `${val.toFixed(1)} yrs`;
      if (dim === 'recency') return val > 75 ? 'Recent (<30d)' : val > 40 ? 'Moderate (30-90d)' : 'Dormant (>180d)';
      return val.toFixed(1);
    };

    const axisLabels = {
      clv: 'CLV Score',
      flights: 'Flight Frequency',
      recency: 'Recency (Active)',
      redemp: 'Redemption Rate',
      tenure: 'Tenure (Years)'
    };

    const finalRadarData = dimensions.map(dim => {
      const row = {
        axis: axisLabels[dim],
        raw: {}
      };
      segmentsToProfile.forEach(seg => {
        const rawVal = avgs[seg][dim];
        row[seg] = normalize(rawVal, dim);
        row.raw[seg] = formatRaw(rawVal, dim);
      });
      return row;
    });

    return finalRadarData;
  }, [members]);

  return (
    <div className="w-full h-[260px] select-none flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="48%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis dataKey="axis" stroke="#8b949e" fontSize={9} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#30363d" tick={false} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="p-3 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip space-y-1.5 min-w-[160px]">
                    <p className="font-bold text-accent border-b border-border/40 pb-1 mb-1">{item.axis}</p>
                    {payload.map((p, idx) => (
                      <p key={idx} style={{ color: p.color }}>
                        <span className="font-semibold">{p.name}</span>:{' '}
                        <strong className="text-text-primary font-semibold">{p.value}%</strong>{' '}
                        <span className="text-text-secondary text-[10px]">({item.raw[p.name]})</span>
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 10, color: '#e6edf3' }} />
          
          <Radar 
            name="Elite Loyalists" 
            dataKey="Elite Loyalists" 
            stroke="#58a6ff" 
            fill="#58a6ff" 
            fillOpacity={0.2} 
          />
          <Radar 
            name="Standard Members" 
            dataKey="Standard Members" 
            stroke="#3fb950" 
            fill="#3fb950" 
            fillOpacity={0.2} 
          />
          <Radar 
            name="At-Risk Flyers" 
            dataKey="At-Risk Flyers" 
            stroke="#f85149" 
            fill="#f85149" 
            fillOpacity={0.2} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SegmentRadarChart;
