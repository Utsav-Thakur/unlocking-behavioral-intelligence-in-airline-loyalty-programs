import React, { useState, useEffect, useMemo } from 'react';
import { useMembers } from '../hooks/useData';
import { 
  Search, 
  User, 
  Award, 
  ShieldAlert, 
  PlaneTakeoff, 
  Calendar, 
  Sparkles, 
  RefreshCw,
  TrendingUp,
  Inbox,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { currency, num, pct, riskClass } from '../utils/formatters';

// Reusable Components
import ChurnGauge from '../components/ChurnGauge';
import EmailWriter from '../components/EmailWriter';

const Lookup = ({ activeMember, setActiveMember }) => {
  const { data: members, isLoading, isError } = useMembers();

  // Search input state
  const [searchVal, setSearchVal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Find exact matching member based on loyalty number string
  const matchedMember = useMemo(() => {
    if (!members || !debouncedSearch) return null;
    return members.find(m => m.loyaltyNumber.toString() === debouncedSearch) || null;
  }, [members, debouncedSearch]);

  // Proactive sync with global active member context
  useEffect(() => {
    setActiveMember(matchedMember);
  }, [matchedMember, setActiveMember]);

  // Top 10 High Risk Members List (Active only, sorted by churn risk desc)
  const topHighRisk = useMemo(() => {
    if (!members) return [];
    return [...members]
      .filter(m => !m.cancellationYear)
      .sort((a, b) => b.churnRisk - a.churnRisk)
      .slice(0, 10);
  }, [members]);

  // 3 Nearest members by proximity to search or CLV
  const nearestMembers = useMemo(() => {
    if (!members || matchedMember || !debouncedSearch) return [];
    
    // Sort by absolute numeric loyalty number difference if search is numeric, else by CLV difference from mean
    const searchNum = parseInt(debouncedSearch, 10);
    return [...members]
      .sort((a, b) => {
        if (!isNaN(searchNum)) {
          return Math.abs(a.loyaltyNumber - searchNum) - Math.abs(b.loyaltyNumber - searchNum);
        }
        return Math.abs(a.clv - 7947) - Math.abs(b.clv - 7947);
      })
      .slice(0, 3);
  }, [members, matchedMember, debouncedSearch]);

  // Click handler from sidebar or suggestions
  const handleSelectMember = (loyaltyNum) => {
    setSearchVal(loyaltyNum.toString());
    setDebouncedSearch(loyaltyNum.toString());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading member database records...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-xl text-center">
        <h2 className="text-danger font-semibold mb-2">Error Loading Registry</h2>
        <p className="text-text-secondary text-sm">Failed to connect to the passenger loyalty database.</p>
      </div>
    );
  }

  // Pre-calculated campaign variables for matched member
  const getCampaign = (seg) => {
    const campaignMap = {
      'Elite Loyalists': {
        priority: 'Low',
        color: 'border-l-success',
        trigger: 'Anniversary signup milestone & high CLV tier maintenance',
        channel: 'Email & App Push',
        offer: 'SURPRISE upgrade voucher + complimentary hub lounge access passes',
        timing: 'March - August (Spring/Summer Peak)'
      },
      'At-Risk Flyers': {
        priority: 'High',
        color: 'border-l-danger',
        trigger: '90-day flight inactivity + decreasing points redemption ratios',
        channel: 'Direct Email & Call Center Outreach',
        offer: '15% fare discount + double point miles voucher for domestic flights',
        timing: 'May - October (Summer-Fall Recovery)'
      },
      'Casual Travelers': {
        priority: 'Medium',
        color: 'border-l-warning',
        trigger: 'Infrequent travel + standard Star tier account thresholds',
        channel: 'Mobile Push Notifications & Email',
        offer: 'Partner brand discounts + weekend companion travel bonus points',
        timing: 'January - April (Winter/Spring Off-Peak)'
      },
      'Standard Members': {
        priority: 'Low',
        color: 'border-l-accent',
        trigger: 'Low travel frequency + check-in feedback survey triggers',
        channel: 'Email Newsletter',
        offer: '10% discount on next baggage fee booking',
        timing: 'Year-round (Flexible)'
      }
    };
    return campaignMap[seg] || campaignMap['Standard Members'];
  };

  const campaign = matchedMember ? getCampaign(matchedMember.segment) : null;

  // Render Last Active text helper
  const getLastActiveText = (m) => {
    if (m.cancellationYear) {
      return `Cancelled (${m.cancellationYear})`;
    }
    if (m.totalFlights > 40) {
      return 'Active (Jun 2018)';
    }
    if (m.totalFlights > 15) {
      return 'Active (Mar 2018)';
    }
    return 'Dormant (Dec 2017)';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">CRM Profile Lookup</h1>
        <p className="text-text-secondary text-sm">Query passenger loyalty accounts and review machine learning telemetry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 select-none">
        
        {/* Left 60% Main Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search Card */}
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Search Passenger ID</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Enter 6-digit Loyalty Number (e.g. 100504, 100010)..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary font-mono"
              />
            </div>
          </div>

          {/* Results Area */}
          {matchedMember ? (
            <div className="space-y-6 count-up">
              {/* Member Card */}
              <div className="card p-6 flex flex-col md:flex-row gap-6 items-center">
                {/* Gauge Semicircle */}
                <div className="flex-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-border/60 pb-6 md:pb-0 md:pr-6">
                  <ChurnGauge probability={matchedMember.churnRisk} size={130} />
                  <div className="text-center mt-3">
                    <span className="text-[10px] text-text-secondary font-semibold uppercase block">Risk Estimation</span>
                    <span className={`font-mono text-sm font-bold block mt-0.5 ${
                      matchedMember.cancellationYear ? 'text-danger' : riskClass(matchedMember.churnRisk)
                    }`}>
                      {matchedMember.cancellationYear ? '100% Churned' : pct(matchedMember.churnRisk)}
                    </span>
                  </div>
                </div>

                {/* Badges and Metrics */}
                <div className="flex-[2] space-y-4 w-full">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      matchedMember.cancellationYear 
                        ? 'bg-danger/10 text-danger border border-danger/20'
                        : matchedMember.churnRisk >= 0.7 
                          ? 'bg-danger/10 text-danger border border-danger/20'
                          : matchedMember.churnRisk >= 0.3
                            ? 'bg-warning/10 text-warning border border-warning/20'
                            : 'bg-success/10 text-success border border-success/20'
                    }`}>
                      {matchedMember.cancellationYear ? 'Churned' : matchedMember.churnRisk >= 0.7 ? 'Critical Risk' : matchedMember.churnRisk >= 0.3 ? 'Moderate' : 'Low Churn Risk'}
                    </span>
                    <span className="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      {matchedMember.segment}
                    </span>
                    <span className="bg-bg border border-border px-2 py-0.5 rounded text-[10px] font-bold text-text-secondary">
                      {matchedMember.card} Tier
                    </span>
                  </div>

                  {/* Info details */}
                  <div className="text-xs text-text-secondary space-y-1">
                    <p><strong className="text-text-primary">Name / Region</strong>: CRM Record #{matchedMember.loyaltyNumber} · {matchedMember.city}, {matchedMember.province}</p>
                    <p><strong className="text-text-primary">Demographics</strong>: {matchedMember.gender} · {matchedMember.maritalStatus} · {matchedMember.education}</p>
                  </div>

                  {/* 3x2 Grid Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-bg/40 p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-secondary block">Historical CLV</span>
                      <span className="font-bold text-text-primary mt-0.5 block">{currency(matchedMember.clv)}</span>
                    </div>
                    <div className="bg-bg/40 p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-secondary block">Forward Score</span>
                      <span className="font-bold text-text-primary mt-0.5 block">
                        {currency(Math.round(matchedMember.clv * (1.15 - matchedMember.churnRisk * 0.9)))}
                      </span>
                    </div>
                    <div className="bg-bg/40 p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-secondary block">Total Flights</span>
                      <span className="font-bold text-accent mt-0.5 block">{num(matchedMember.totalFlights)}</span>
                    </div>
                    <div className="bg-bg/40 p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-secondary block">Points Balance</span>
                      <span className="font-bold text-text-primary mt-0.5 block">{num(matchedMember.pointsAccumulated)}</span>
                    </div>
                    <div className="bg-bg/40 p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-secondary block">Recency Score</span>
                      <span className="font-bold text-success mt-0.5 block">
                        {Math.round(matchedMember.totalFlights > 0 ? (1 - matchedMember.churnRisk) * 100 : 5)}/100
                      </span>
                    </div>
                    <div className="bg-bg/40 p-2 rounded-lg border border-border/40">
                      <span className="text-[10px] text-text-secondary block">Last Active</span>
                      <span className="font-bold text-text-primary mt-0.5 block truncate">
                        {getLastActiveText(matchedMember)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescriptive Retention Plan */}
              <div className="card p-5 space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1"><Calendar className="h-4 w-4 text-text-secondary" /> Prescribed Retention Campaign</h3>
                
                <div className={`border-l-4 p-4 bg-bg/40 rounded-r-lg ${campaign.color}`}>
                  <table className="w-full text-xs text-left leading-normal border-collapse">
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 text-text-secondary font-semibold uppercase text-[10px] w-1/4">Trigger</td>
                        <td className="py-2.5 text-text-primary font-medium">{campaign.trigger}</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 text-text-secondary font-semibold uppercase text-[10px]">Channel</td>
                        <td className="py-2.5 text-text-primary font-medium">{campaign.channel}</td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-2.5 text-text-secondary font-semibold uppercase text-[10px]">Incentive Offer</td>
                        <td className="py-2.5 text-accent font-bold">{campaign.offer}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-text-secondary font-semibold uppercase text-[10px]">Timing</td>
                        <td className="py-2.5 text-text-primary font-medium">{campaign.timing}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Email Writer component below */}
              <EmailWriter member={matchedMember} />
            </div>
          ) : debouncedSearch ? (
            /* Not Found State */
            <div className="card p-6 text-center space-y-4 count-up">
              <div className="flex flex-col items-center gap-2">
                <Inbox className="h-10 w-10 text-danger animate-pulse" />
                <h3 className="text-sm font-bold text-text-primary">No Passenger Record Found</h3>
                <p className="text-text-secondary text-xs">
                  We could not find an exact match for ID **"{debouncedSearch}"**. Showing closest profiles by loyalty proximity:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-left pt-2">
                {nearestMembers.map(m => (
                  <div 
                    key={m.loyaltyNumber}
                    onClick={() => handleSelectMember(m.loyaltyNumber)}
                    className="flex justify-between items-center bg-bg/50 border border-border/60 hover:border-accent p-3 rounded-lg text-xs cursor-pointer transition-all active:scale-99 hover:bg-card-hover/20"
                  >
                    <div>
                      <span className="font-bold text-accent font-mono">#{m.loyaltyNumber}</span>
                      <span className="text-text-secondary ml-2">· {m.city}, {m.province} · {m.card}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-secondary">CLV: {currency(m.clv)}</span>
                      <ChevronRight className="h-4 w-4 text-text-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="card p-8 text-center space-y-4 select-none">
              <div className="flex flex-col items-center gap-2 text-text-secondary">
                <Inbox className="h-12 w-12 text-border/80" />
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">CRM Inspection Terminal</h3>
                <p className="text-text-secondary text-xs max-w-sm">
                  Search by loyalty account number to review custom speedometer risk ratings, demographics, flight balances, and strategize retainments.
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold mb-2">Suggested Accounts to inspect</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[100504, 100010, 100015, 100102, 100808].map(num => (
                    <button
                      key={num}
                      onClick={() => handleSelectMember(num)}
                      className="bg-accent/10 border border-accent/20 hover:border-accent text-accent px-3 py-1.5 rounded-lg text-xs font-mono font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 40% Sidebar (Top 10 High Risk Members List) */}
        <div className="lg:col-span-2 card p-5 space-y-4 h-fit">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger animate-pulse" /> 🔴 Top 10 High Risk Active Flyers
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Active profiles sorted by predictive churn probability.</p>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {topHighRisk.map((m) => (
              <div
                key={m.loyaltyNumber}
                onClick={() => handleSelectMember(m.loyaltyNumber)}
                className={`p-3 rounded-lg border border-border/50 bg-bg/25 hover:bg-card-hover/20 hover:border-danger/60 transition-all cursor-pointer flex justify-between items-center text-xs ${
                  matchedMember?.loyaltyNumber === m.loyaltyNumber ? 'border-accent bg-accent/5' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-accent">#{m.loyaltyNumber}</span>
                    <span className="text-[10px] text-text-secondary">· {m.card}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary truncate max-w-[150px]">{m.city}, {m.province}</div>
                </div>
                
                <div className="text-right">
                  <span className="font-mono font-bold text-danger block">{pct(m.churnRisk)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary block font-semibold">{m.segment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Lookup;
