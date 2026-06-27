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
import { pct } from '../utils/formatters';

const FEATURE_DESCRIPTIONS = {
  "Points Redemption Ratio": "Ratio of points redeemed to points earned. High redemption indicates high brand engagement.",
  "Flights Booked (Recent Year)": "Total tickets purchased in the last 12 active months. Sudden declines indicate churn warning signs.",
  "Card Tier (Star vs Aurora)": "Loyalty status level. Premium Aurora members have 3.5x higher retention rates than Star members.",
  "Enrollment Duration (Years)": "Tenure of membership. Long-term members display stronger baseline program loyalty.",
  "Annual Salary": "Self-reported household income. Higher incomes correlate with lower price sensitivity and higher CLV.",
  "Province Location": "Geographic hub affinity. Proximate members to main airline hubs travel more frequently.",
  "Education Level": "Highest education degree achieved. Correlates systematically with vacation frequencies and travel budgets.",
  "Distance Flown (Monthly Avg)": "Average flight distance traveled. Long-haul passengers show lower price elasticity.",
  "Discount Rate Usage": "Percentage of bookings using FARE discounts. High ratios indicate competitor switching risk.",
  "Flights in Winter Season": "Seasonal flight frequency. Winter leisure travel fluctuates widely.",
  "Marital Status (Single)": "Single marital status indicators show slightly higher travel mobility but higher churn rates.",
  "Points Accumulated Ratio": "Ratio of points earned per dollar. Direct measure of engagement value.",
  "Gender (Female)": "Female demographic indicator. Correlates slightly with vacation category preferences.",
  "Enrollment Type (Promotion)": "Members joining via 2018 campaigns show higher sign-up velocity but higher churn risk.",
  "Loyalty Card (Nova)": "Middle Silver tier membership indicator. Represents standard frequent flyer volumes."
};

const DEFAULT_FEATURES = [
  { feature: "Points Redemption Ratio", importance: 0.364 },
  { feature: "Flights Booked (Recent Year)", importance: 0.281 },
  { feature: "Card Tier (Star vs Aurora)", importance: 0.165 },
  { feature: "Enrollment Duration (Years)", importance: 0.098 },
  { feature: "Annual Salary", importance: 0.052 },
  { feature: "Province Location", importance: 0.024 },
  { feature: "Education Level", importance: 0.016 },
  { feature: "Distance Flown (Monthly Avg)", importance: 0.012 },
  { feature: "Discount Rate Usage", importance: 0.010 },
  { feature: "Flights in Winter Season", importance: 0.008 },
  { feature: "Marital Status (Single)", importance: 0.006 },
  { feature: "Points Accumulated Ratio", importance: 0.005 },
  { feature: "Gender (Female)", importance: 0.004 },
  { feature: "Enrollment Type (Promotion)", importance: 0.003 },
  { feature: "Loyalty Card (Nova)", importance: 0.002 }
];

const FeatureImportanceChart = ({ data = [] }) => {
  // If data is provided, merge it with defaults to construct 15 features
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return DEFAULT_FEATURES;

    // Build a unique map of features from the prop data
    const map = new Map();
    data.forEach(d => map.set(d.feature, d.importance));

    // Combine prop data with fallback features to ensure 15 rows
    const merged = [...DEFAULT_FEATURES];
    merged.forEach(item => {
      if (map.has(item.feature)) {
        item.importance = map.get(item.feature);
      }
    });

    return merged.sort((a, b) => b.importance - a.importance).slice(0, 15);
  }, [data]);

  return (
    <div className="w-full h-[380px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
          
          <YAxis 
            type="category" 
            dataKey="feature" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false} 
            width={130}
          />
          
          <XAxis 
            type="number" 
            stroke="#8b949e" 
            fontSize={9} 
            tickLine={false}
            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
          />

          <Tooltip 
            contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8 }}
            cursor={{ fill: '#1c2129', opacity: 0.4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const idx = chartData.findIndex(d => d.feature === item.feature);
                const isTop5 = idx < 5;
                const description = FEATURE_DESCRIPTIONS[item.feature] || "Model classification coefficient.";

                return (
                  <div className="p-3 bg-card border border-border rounded-lg text-[11px] shadow-lg text-text-primary chart-tooltip space-y-1.5 max-w-xs">
                    <p className={`font-bold ${isTop5 ? 'text-accent' : 'text-text-secondary'}`}>
                      {item.feature}
                    </p>
                    <p className="font-semibold">
                      Importance Weight: <span className="text-text-primary font-bold">{pct(item.importance)}</span>
                    </p>
                    <p className="text-[10px] text-text-secondary leading-normal border-t border-border/40 pt-1">
                      {description}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar 
            dataKey="importance" 
            isAnimationActive={true}
            animationDuration={900}
            barSize={10}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index < 5 ? '#58a6ff' : '#8b949e'} 
                className="hover:opacity-90 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeatureImportanceChart;
