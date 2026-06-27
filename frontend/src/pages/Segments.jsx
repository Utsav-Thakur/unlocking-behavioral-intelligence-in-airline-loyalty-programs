import React, { useState } from 'react';
import { useSegments, useMembers } from '../hooks/useData';
import { Sparkles, Users, Award, MapPin, DollarSign, Activity, RefreshCw, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { currency, num, pct } from '../utils/formatters';

// Reusable Components
import SegmentRadarChart from '../components/SegmentRadarChart';
import CLVScatterChart from '../components/CLVScatterChart';
import CLVForwardScatter from '../components/CLVForwardScatter';
import ChartNarrator from '../components/ChartNarrator';

const Segments = () => {
  const { data: segments, isLoading, isError } = useSegments();
  const { data: members } = useMembers();

  // Local state for expanded segment card
  const [expandedSeg, setExpandedSeg] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading cohort segments...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-xl text-center">
        <h2 className="text-danger font-semibold mb-2">Error Loading Cohorts</h2>
        <p className="text-text-secondary text-sm">Failed to connect to the segment clustering indexes.</p>
      </div>
    );
  }

  // Active segments list (Elite Loyalists, At-Risk Flyers, Casual Travelers)
  const activeSegments = segments.filter(s => s.segment !== 'Dormant / Churned');

  // Pre-calculated campaign profiles for expansion view
  const campaignProfiles = {
    'Elite Loyalists': {
      priority: 'Low Priority Retention Campaign',
      priorityColor: 'text-success border-success/35 bg-success/5',
      trigger: 'Anniversary signup milestone & high CLV tier maintenance',
      channel: 'Direct Account Executive Email & Executive App Push',
      offer: 'SURPRISE complimentary upgrade voucher + Hub Lounge passes',
      timing: 'March - August (Spring/Summer Peak Season)'
    },
    'At-Risk Flyers': {
      priority: 'High Priority Retention Campaign',
      priorityColor: 'text-danger border-danger/35 bg-danger/5',
      trigger: '90-day flight inactivity + decreasing points redemption ratios',
      channel: 'Direct Email Offer & Direct Support Call Center Outreach',
      offer: '15% fare discount + double point miles voucher for domestic flights',
      timing: 'May - October (Summer-Fall Recovery Window)'
    },
    'Casual Travelers': {
      priority: 'Medium Priority Retention Campaign',
      priorityColor: 'text-warning border-warning/35 bg-warning/5',
      trigger: 'Infrequent travel + standard Star tier account thresholds',
      channel: 'Mobile App Push Notifications & Email Campaigns',
      offer: 'Partner brand discounts + weekend companion travel bonus points',
      timing: 'January - April (Winter/Spring Off-Peak Season)'
    },
    'Standard Members': {
      priority: 'Low Priority Retention Campaign',
      priorityColor: 'text-accent border-accent/35 bg-accent/5',
      trigger: 'Low travel frequency + check-in feedback survey triggers',
      channel: 'Email Newsletter',
      offer: '10% discount on next baggage fee booking',
      timing: 'Year-round (Flexible)'
    }
  };

  const handleToggleExpand = (segName) => {
    setExpandedSeg(prev => (prev === segName ? null : segName));
  };

  // Helper to extract dominant card tier
  const getDominantCard = (dist) => {
    if (!dist) return 'Star';
    return Object.entries(dist).sort((a, b) => b[1] - a[1])[0][0];
  };

  // Helper to extract top province
  const getTopProvince = (provs) => {
    if (!provs) return 'Ontario';
    return Object.entries(provs).sort((a, b) => b[1] - a[1])[0][0];
  };

  // Color mappings for top borders
  const borderColors = {
    'Elite Loyalists': 'border-t-success',
    'At-Risk Flyers': 'border-t-danger',
    'Casual Travelers': 'border-t-warning',
    'Standard Members': 'border-t-accent'
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Customer Segments</h1>
        <p className="text-text-secondary text-sm">Targeted profiling of loyalty program cohorts and behavioral characteristics.</p>
      </div>

      {/* Radar Comparison Card at the top */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
          <Sparkles className="h-4.5 w-4.5 text-accent" /> Cohort Normalized Radar Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <p>
              The radar chart details segment behaviors across 5 key normalized metrics. Elite Loyalists showcase high tenure and frequency, whereas At-Risk Flyers reflect declining recency ratings.
            </p>
            <div className="text-[11px] leading-normal space-y-1.5 pt-2 border-t border-border/20">
              <p>• <strong className="text-accent">CLV Score</strong>: Lifetime invoice value weight.</p>
              <p>• <strong className="text-success">Frequency</strong>: Flight booking logs count.</p>
              <p>• <strong className="text-warning">Recency</strong>: Travel window activity proximity.</p>
              <p>• <strong className="text-accent">Redemption</strong>: Point redemption ratios.</p>
              <p>• <strong className="text-text-primary">Tenure</strong>: Total sign-up duration.</p>
            </div>
          </div>
          <div className="md:col-span-2 h-[340px]">
            <ChartNarrator chartType="Cohort Radar Ratings" chartData={segments}>
              <SegmentRadarChart members={members || []} />
            </ChartNarrator>
          </div>
        </div>
      </div>

      {/* 3 Segment Cards in a Grid */}
      <div className="grid grid-cols-1 gap-6">
        {activeSegments.map((seg) => {
          const isExpanded = expandedSeg === seg.segment;
          const borderTop = borderColors[seg.segment] || 'border-t-border';
          const dominantCard = getDominantCard(seg.cardTierDist);
          const topProvince = getTopProvince(seg.topProvinces);
          const plan = campaignProfiles[seg.segment] || campaignProfiles['Standard Members'];

          // Filter members to segment for CLV Scatter Chart
          const segmentMembers = members ? members.filter(m => m.segment === seg.segment) : [];

          return (
            <div 
              key={seg.segment} 
              className={`card p-5 border-t-4 ${borderTop} hover:border-accent/40 transition-all select-none count-up`}
            >
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-text-primary">{seg.segment}</h2>
                    <span className="bg-accent/15 border border-accent/25 px-2 py-0.5 rounded text-[10px] font-bold text-accent uppercase tracking-wider">
                      {pct(seg.percentage)} Share
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs">{seg.description}</p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/churn"
                    state={{ prefilteredSegment: seg.segment }}
                    className="bg-card hover:bg-card-hover border border-border text-text-primary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    View Members
                  </Link>
                  <button
                    onClick={() => handleToggleExpand(seg.segment)}
                    className="bg-accent text-bg hover:opacity-90 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    {isExpanded ? (
                      <>
                        Hide Details <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Expand Details <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Segment metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4">
                <div className="bg-bg/40 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-accent" /> Count
                  </span>
                  <span className="font-bold text-text-primary text-sm mt-1 block">{num(seg.count)} Members</span>
                </div>
                <div className="bg-bg/40 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-accent" /> Avg CLV
                  </span>
                  <span className="font-bold text-text-primary text-sm mt-1 block">{currency(seg.avgClv)}</span>
                </div>
                <div className="bg-bg/40 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-accent" /> Dominant Card
                  </span>
                  <span className="font-bold text-text-primary text-sm mt-1 block">{dominantCard}</span>
                </div>
                <div className="bg-bg/40 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-accent" /> Top Region
                  </span>
                  <span className="font-bold text-text-primary text-sm mt-1 block">{topProvince}</span>
                </div>
              </div>

              {/* Expanded details section */}
              {isExpanded && (
                <div className="mt-5 pt-5 border-t border-border/40 space-y-6 count-up">
                  {/* Prescriptive Retention Plan */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-accent" /> Segment Campaign Strategy
                    </h3>
                    <div className="bg-bg/50 border border-border p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-text-secondary uppercase">Retention Strategy Plan</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] border font-bold ${plan.priorityColor}`}>
                          {plan.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                        <div>
                          <span className="text-[10px] text-text-secondary block font-semibold uppercase">Trigger Signal</span>
                          <p className="text-text-primary font-medium">{plan.trigger}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-secondary block font-semibold uppercase">Channel Outreach</span>
                          <p className="text-text-primary font-medium">{plan.channel}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[10px] text-text-secondary block font-semibold uppercase">Campaign Incentive Offer</span>
                          <p className="text-text-primary font-medium bg-card-hover/40 p-2 rounded border border-border/30 mt-1">{plan.offer}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-secondary block font-semibold uppercase">Launch Timing</span>
                          <p className="text-text-primary font-medium">{plan.timing}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CLVScatterChart filtered to segment */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-accent" /> Segment Risk to CLV Proximity
                    </h3>
                    <div className="h-[280px]">
                      <CLVScatterChart members={segmentMembers} colorBy="churn_risk" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CLVForwardScatter at Bottom */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2">
          <span className="flex items-center gap-1.5"><DollarSign className="h-4.5 w-4.5 text-accent" /> Forward CLV Projections by Segment</span>
        </h2>
        <div className="h-[360px]">
          <ChartNarrator chartType="Forward CLV Segment Correlation" chartData={members}>
            <CLVForwardScatter members={members || []} colorBy="segment" />
          </ChartNarrator>
        </div>
      </div>
    </div>
  );
};

export default Segments;
