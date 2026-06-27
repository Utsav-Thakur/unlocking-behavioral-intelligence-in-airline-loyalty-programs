import React, { useState, useMemo } from 'react';
import { useSegments, useMembers } from '../hooks/useData';
import { 
  Calendar, 
  Sparkles, 
  Download, 
  Mail, 
  Users, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Tag, 
  Coins, 
  Eye, 
  ArrowRight,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Reusable Components
import RetentionGantt from '../components/RetentionGantt';
import ChartNarrator from '../components/ChartNarrator';
import EmailWriter from '../components/EmailWriter';

const Retention = ({ setActiveMember }) => {
  const { data: segments, isLoading: segmentsLoading } = useSegments();
  const { data: members, isLoading: membersLoading } = useMembers();

  // Local state for priority filter pill (All / High / Medium)
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modal Email Composer State
  const [emailModalCamp, setEmailModalCamp] = useState(null); // campaign object

  // Campaign configurations matching segments
  const campaignCards = [
    {
      id: 'at_risk',
      segment: 'At-Risk Flyers',
      priority: 'High',
      borderColor: 'border-l-danger',
      who: 'Members with 90-day inactive flight status and falling point usage logs.',
      when: 'May to October (Peak summer recovery window).',
      trigger: '90-day flight inactivity + decreasing points redemption ratios.',
      channel: 'Direct Email Offer & Direct Support Call Center Outreach.',
      offer: '15% fare discount + double point miles voucher for domestic flights.',
      message_hook: 'We notice you haven\'t flown in a while! Here is 15% off to get you back in the skies.',
      expected_outcome: '28% churn reduction rate, recovering an estimated $1.2M in CLV.',
      cost_per_member: '$45.00'
    },
    {
      id: 'casual',
      segment: 'Casual Travelers',
      priority: 'Medium',
      borderColor: 'border-l-warning',
      who: 'Flyers with standard Star tier balances and infrequent booking logs.',
      when: 'January to April (Winter off-peak seasonal valleys).',
      trigger: 'Infrequent travel + standard Star tier account thresholds.',
      channel: 'Mobile App Push Notifications & Email Campaigns.',
      offer: 'Partner brand discounts + weekend companion travel bonus points.',
      message_hook: 'Planning a weekend getaway? Take a companion for double loyalty points!',
      expected_outcome: '12% churn reduction rate, increasing lifetime point redeems.',
      cost_per_member: '$15.00'
    },
    {
      id: 'elite',
      segment: 'Elite Loyalists',
      priority: 'Low',
      borderColor: 'border-l-success',
      who: 'Members maintaining high CLV tier classifications and milestone signups.',
      when: 'March to August (Spring/Summer flight peak season).',
      trigger: 'Anniversary signup milestone & high CLV tier maintenance.',
      channel: 'Direct Account Executive Email & Executive App Push.',
      offer: 'SURPRISE complimentary upgrade voucher + Hub Lounge passes.',
      message_hook: 'Thank you for your ongoing commitment. Enjoy a surprise upgrade on us!',
      expected_outcome: '8% churn reduction rate, securing top-tier passenger loyalty.',
      cost_per_member: '$85.00'
    }
  ];

  // Filtering campaigns
  const filteredCampaigns = useMemo(() => {
    if (priorityFilter === 'All') return campaignCards;
    return campaignCards.filter(c => c.priority === priorityFilter);
  }, [priorityFilter]);

  // Find sample member of a segment
  const getSampleMember = (segName) => {
    if (!members) return null;
    return members.find(m => m.segment === segName && !m.cancellationYear) || null;
  };

  const handleOpenEmailModal = (camp) => {
    const sample = getSampleMember(camp.segment);
    if (sample) {
      setActiveMember(sample); // Set active context globally
      setEmailModalCamp(camp);
    } else {
      alert("No active member records found for this cohort in the CRM database.");
    }
  };

  const handleExportCSV = () => {
    const headers = 'Segment,Priority,Target Cohort,Timeline Window,Trigger Event,Outreach Channel,Campaign Offer,Message Hook,Expected Outcome,Cost per Passenger\n';
    
    const rows = campaignCards.map(c => {
      return `"${c.segment}","${c.priority}","${c.who}","${c.when}","${c.trigger}","${c.channel}","${c.offer}","${c.message_hook}","${c.expected_outcome}","${c.cost_per_member}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `loyalty_iq_prescriptive_retention_plan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (segmentsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading campaign timeline charts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Retention Scheduler</h1>
          <p className="text-text-secondary text-sm">Prescriptive campaign outlines and scheduling timelines.</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-accent text-bg hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer border-none shadow-md"
        >
          <Download className="h-4 w-4" /> Export Retention Plan
        </button>
      </div>

      {/* Gantt Timeline wrapped in ChartNarrator */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Timeline Gantt Tracker</span>
        </div>
        <ChartNarrator chartType="Retention Timeline Gantt" chartData={segments}>
          <RetentionGantt />
        </ChartNarrator>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 text-xs pt-4 select-none">
        <span className="text-text-secondary font-semibold">Priority Filter:</span>
        {['All', 'High', 'Medium'].map(prio => (
          <button
            key={prio}
            onClick={() => setPriorityFilter(prio)}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              priorityFilter === prio
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-card border-border text-text-secondary hover:text-text-primary hover:bg-card-hover'
            }`}
          >
            {prio} Priority
          </button>
        ))}
      </div>

      {/* Retention Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        {filteredCampaigns.map((camp) => {
          const sample = getSampleMember(camp.segment);
          
          return (
            <div 
              key={camp.id} 
              className={`card p-5 border-l-4 ${camp.borderColor} flex flex-col justify-between hover:border-accent/40 transition-all select-none count-up`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-border/40 pb-2.5">
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">{camp.segment}</h3>
                    <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono mt-0.5">Campaign details</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    camp.priority === 'High' 
                      ? 'bg-danger/10 text-danger border-danger/20' 
                      : camp.priority === 'Medium'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-success/10 text-success border-success/20'
                  }`}>
                    {camp.priority} Priority
                  </span>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 gap-3.5 text-xs">
                  <div className="flex gap-2">
                    <Users className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Target Cohort (Who)</span>
                      <p className="text-text-primary mt-0.5 font-medium">{camp.who}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Clock className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Timeline Launch Window (When)</span>
                      <p className="text-text-primary mt-0.5 font-medium">{camp.when}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Trigger Condition</span>
                      <p className="text-text-primary mt-0.5 font-medium">{camp.trigger}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Mail className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Outreach Channel</span>
                      <p className="text-text-primary mt-0.5 font-medium">{camp.channel}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Tag className="h-4.5 w-4.5 text-accent shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Incentive Campaign Offer</span>
                      <p className="text-accent mt-0.5 font-semibold bg-bg/50 px-2 py-1.5 border border-border/50 rounded">{camp.offer}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-success shrink-0 animate-pulse" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Message Copy Hook</span>
                      <p className="text-text-primary mt-0.5 italic">"{camp.message_hook}"</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Activity className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Expected Outcome</span>
                      <p className="text-text-primary mt-0.5 font-medium">{camp.expected_outcome}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Coins className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase block font-semibold">Cost Per targeted Passenger</span>
                      <p className="text-text-primary mt-0.5 font-bold">{camp.cost_per_member}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-2 border-t border-border/40 pt-4 mt-4">
                <Link
                  to="/churn"
                  state={{ prefilteredSegment: camp.segment, prefilteredPriority: camp.priority }}
                  className="flex-1 bg-card hover:bg-card-hover border border-border text-text-primary px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer text-center"
                >
                  <Eye className="h-4 w-4" /> View Affected
                </Link>
                <button
                  onClick={() => handleOpenEmailModal(camp)}
                  className="flex-1 bg-accent text-bg hover:opacity-90 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer border-none"
                >
                  <Sparkles className="h-4 w-4 fill-current animate-pulse" /> Generate Email
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Email Modal Overlay */}
      {emailModalCamp && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEmailModalCamp(null)}
            className="absolute inset-0 cursor-default"
          />
          <div className="card w-full max-w-lg bg-card border border-border shadow-2xl relative z-10 p-6 flex flex-col justify-between count-up">
            <button
              onClick={() => setEmailModalCamp(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-card-hover text-text-secondary hover:text-text-primary transition-all border-none cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-accent" /> AI Strategy Campaign Composer
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">Cohort: {emailModalCamp.segment} Campaign</p>
              </div>

              {/* Render reusable EmailWriter */}
              <EmailWriter member={getSampleMember(emailModalCamp.segment)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Retention;
