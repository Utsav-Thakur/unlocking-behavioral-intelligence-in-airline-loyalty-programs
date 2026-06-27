import React, { useState } from 'react';
import { ShieldAlert, Target, Award, Calendar } from 'lucide-react';

const RetentionGantt = () => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const campaigns = [
    {
      id: 'elite',
      segment: 'Elite Loyalists',
      startMonth: 3, // March (1-indexed)
      endMonth: 8,   // August
      trigger: 'Anniversary signup milestone & high CLV tier maintenance',
      offer: 'SURPRISE upgrade voucher + complimentary hub lounge access passes',
      priority: 'Low',
      color: 'bg-success/20 border-success text-success',
      icon: Award
    },
    {
      id: 'at_risk',
      segment: 'At-Risk Flyers',
      startMonth: 5, // May
      endMonth: 10,  // October
      trigger: '90-day flight inactivity + decreasing points redemption ratios',
      offer: '15% fare discount + double point miles voucher for domestic flights',
      priority: 'High',
      color: 'bg-danger/20 border-danger text-danger',
      icon: ShieldAlert
    },
    {
      id: 'casual',
      segment: 'Casual Travelers',
      startMonth: 1, // January
      endMonth: 4,   // April
      trigger: 'Infrequent travel + standard Star tier account thresholds',
      offer: 'Partner brand discounts + weekend companion travel bonus points',
      priority: 'Medium',
      color: 'bg-warning/20 border-warning text-warning',
      icon: Target
    }
  ];

  return (
    <div className="w-full card p-5 select-none relative overflow-visible">
      {/* Title Header */}
      <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
        <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" /> Campaign Timeline (Gantt Scheduler)
        </h3>
        <div className="flex gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> High Priority</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Medium Priority</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Low Priority</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="min-w-[640px]">
        {/* Months Header Row */}
        <div className="grid grid-cols-[140px_repeat(12,1fr)] gap-1 text-[10px] font-semibold text-text-secondary border-b border-border/40 pb-2 text-center uppercase tracking-wider">
          <div className="text-left pl-2">Segment</div>
          {months.map(m => (
            <div key={m} className="border-l border-border/20 py-1">{m}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-4 py-4 relative">
          {campaigns.map((camp) => {
            const IconComponent = camp.icon;
            
            // Calculate CSS grid column ranges
            // Column 1 is segment labels. Column 2 is Jan, 3 is Feb... 13 is Dec.
            const gridColStart = camp.startMonth + 1;
            const gridColEnd = camp.endMonth + 2; // end is exclusive in grid spans

            return (
              <div 
                key={camp.id} 
                className="grid grid-cols-[140px_repeat(12,1fr)] gap-1 items-center relative group min-h-[44px]"
              >
                {/* Left Label */}
                <div className="text-[11px] font-bold text-text-primary flex items-center gap-2 pl-2">
                  <IconComponent className="h-3.5 w-3.5 shrink-0 text-text-secondary group-hover:text-accent transition-colors" />
                  <span className="truncate">{camp.segment}</span>
                </div>

                {/* Background Grid Cells */}
                {months.map((_, i) => (
                  <div 
                    key={i} 
                    className="h-9 border-l border-border/20 flex items-center justify-center bg-bg/20"
                  />
                ))}

                {/* Campaign Timeline Bar */}
                <div
                  style={{
                    gridColumnStart: gridColStart,
                    gridColumnEnd: gridColEnd
                  }}
                  onMouseEnter={() => setHoveredBar(camp)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className={`h-7 border rounded flex items-center px-3.5 text-[10px] font-semibold tracking-wide cursor-pointer transition-all duration-150 relative z-10 select-none ${camp.color}`}
                >
                  <span className="truncate">{camp.offer}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredBar && (
        <div className="absolute top-[80%] left-6 z-40 w-[300px] bg-card border border-border p-3.5 rounded-lg shadow-2xl space-y-2 count-up chart-tooltip pointer-events-none">
          <div className="flex justify-between items-center pb-1 border-b border-border/40">
            <span className="text-xs font-bold text-text-primary">{hoveredBar.segment}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
              hoveredBar.priority === 'High' 
                ? 'bg-danger/20 text-danger border border-danger/30' 
                : hoveredBar.priority === 'Medium' 
                  ? 'bg-warning/20 text-warning border border-warning/30' 
                  : 'bg-success/20 text-success border border-success/30'
            }`}>
              {hoveredBar.priority} PRIORITY
            </span>
          </div>
          <div className="text-[11px] leading-relaxed space-y-1.5">
            <p>
              <strong className="text-accent font-semibold">Campaign: </strong>
              <span className="text-text-primary font-medium">{hoveredBar.offer}</span>
            </p>
            <p>
              <strong className="text-text-secondary font-semibold">Trigger: </strong>
              <span className="text-text-secondary leading-snug">{hoveredBar.trigger}</span>
            </p>
            <p className="text-[10px] text-accent mt-1 flex items-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              Active Period: {months[hoveredBar.startMonth - 1]} – {months[hoveredBar.endMonth - 1]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionGantt;
