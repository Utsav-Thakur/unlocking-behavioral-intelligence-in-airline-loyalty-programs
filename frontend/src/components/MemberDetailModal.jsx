import React from 'react';
import { X, User, ShieldAlert, Award, Target, Calendar, PlaneTakeoff, Mail, CreditCard, DollarSign } from 'lucide-react';
import ChurnGauge from './ChurnGauge';
import { currency, num, pct, riskClass } from '../utils/formatters';

const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;

  // Segment campaigns mapping
  const campaignMap = {
    'Elite Loyalists': {
      priority: 'Low',
      color: 'border-success text-success bg-success/10',
      trigger: 'Anniversary signup milestone & high CLV tier maintenance',
      channel: 'Email & App Push',
      offer: 'SURPRISE upgrade voucher + complimentary hub lounge access passes',
      timing: 'March - August (Spring/Summer Peak)'
    },
    'At-Risk Flyers': {
      priority: 'High',
      color: 'border-danger text-danger bg-danger/10',
      trigger: '90-day flight inactivity + decreasing points redemption ratios',
      channel: 'Direct Email & Call Center Outreach',
      offer: '15% fare discount + double point miles voucher for domestic flights',
      timing: 'May - October (Summer-Fall Recovery)'
    },
    'Casual Travelers': {
      priority: 'Medium',
      color: 'border-warning text-warning bg-warning/10',
      trigger: 'Infrequent travel + standard Star tier account thresholds',
      channel: 'Mobile Push Notifications & Email',
      offer: 'Partner brand discounts + weekend companion travel bonus points',
      timing: 'January - April (Winter/Spring Off-Peak)'
    },
    'Standard Members': {
      priority: 'Low',
      color: 'border-accent text-accent bg-accent/10',
      trigger: 'Low travel frequency + check-in feedback survey triggers',
      channel: 'Email Newsletter',
      offer: '10% discount on next baggage fee booking',
      timing: 'Year-round (Flexible)'
    }
  };

  const campaign = campaignMap[member.segment] || campaignMap['Standard Members'];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card Backdrop click close */}
      <div 
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 count-up border border-border shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-card-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer border-none"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Member Title & Speedometer Gauge */}
        <div className="flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-8 gap-4 select-none">
          <div className="text-center">
            <span className="badge-accent text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              {member.card} Tier
            </span>
            <h2 className="text-xl font-bold text-text-primary mt-1.5 flex items-center justify-center gap-1.5 font-display">
              <User className="h-5 w-5 text-accent" /> Member Profile
            </h2>
            <p className="text-xs text-text-secondary font-mono mt-0.5">ID: {member.loyaltyNumber}</p>
          </div>

          <div className="my-2">
            <ChurnGauge probability={member.churnRisk} size={150} />
          </div>

          <div className="text-center space-y-1">
            <div className="text-xs text-text-secondary">Risk Status</div>
            <div className="flex items-center justify-center gap-2">
              {member.cancellationYear ? (
                <span className="badge-high text-[11px] font-bold">CANCELLED</span>
              ) : (
                <span className={`${riskClass(member.churnRisk)} text-[11px] font-bold px-2 py-0.5 rounded`}>
                  {member.churnRisk >= 0.7 ? 'CRITICAL RISK' : member.churnRisk >= 0.3 ? 'MODERATE RISK' : 'LOW RISK'}
                </span>
              )}
              <span className="badge-accent text-[11px] font-bold px-2 py-0.5 rounded">
                {member.segment}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Profile Details & Stats */}
        <div className="flex-[2] space-y-6">
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-text-secondary" /> Demographics & CRM Info
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Gender / Marital</span>
                <span className="font-semibold text-text-primary block mt-0.5">
                  {member.gender} · {member.maritalStatus}
                </span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Education</span>
                <span className="font-semibold text-text-primary block mt-0.5 truncate">{member.education}</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Annual Salary</span>
                <span className="font-semibold text-text-primary block mt-0.5">
                  {member.salary !== null ? currency(member.salary) : 'Not Disclosed'}
                </span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50 col-span-2">
                <span className="text-[10px] text-text-secondary block">Location Details</span>
                <span className="font-semibold text-text-primary block mt-0.5">
                  {member.city}, {member.province} ({member.postalCode})
                </span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Enrolled Date</span>
                <span className="font-semibold text-text-primary block mt-0.5">
                  {member.enrollmentYear}-{String(member.enrollmentMonth).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Flights History */}
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PlaneTakeoff className="h-4 w-4 text-text-secondary" /> Flight Telemetry & Points
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Total Flights</span>
                <span className="font-bold text-accent block mt-0.5">{num(member.totalFlights)}</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Distance Traveled</span>
                <span className="font-bold text-text-primary block mt-0.5">{num(member.totalDistance)} km</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Points Accumulated</span>
                <span className="font-bold text-text-primary block mt-0.5">{num(member.pointsAccumulated)}</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-text-secondary block">Redemption Ratio</span>
                <span className="font-bold text-success block mt-0.5">{pct(member.redemptionRatio)}</span>
              </div>
            </div>
            
            <div className="mt-2.5 bg-bg/20 p-3 rounded-lg border border-border/30 flex justify-between text-xs items-center">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-text-secondary">Historical CLV (Invoice Value):</span>
              </div>
              <span className="font-bold text-text-primary text-sm">{currency(member.clv)}</span>
            </div>
          </div>

          {/* Section 3: Retention Plan */}
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-text-secondary" /> Prescriptive Churn Retention Plan
            </h3>
            
            <div className={`border-l-4 p-4 bg-bg/50 rounded-r-lg space-y-3 border-l-4 ${campaign.priority === 'High' ? 'border-danger' : campaign.priority === 'Medium' ? 'border-warning' : 'border-success'}`}>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-text-secondary uppercase">Retention Strategy</span>
                <span className={`px-2 py-0.5 rounded text-[9px] ${
                  campaign.priority === 'High' 
                    ? 'bg-danger/10 text-danger border border-danger/20' 
                    : campaign.priority === 'Medium'
                      ? 'bg-warning/10 text-warning border border-warning/20'
                      : 'bg-success/10 text-success border border-success/20'
                }`}>
                  {campaign.priority} Priority Campaign
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                <div className="space-y-1">
                  <span className="text-[10px] text-text-secondary block font-semibold uppercase">Trigger Signal</span>
                  <p className="text-text-primary font-medium">{campaign.trigger}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-text-secondary block font-semibold uppercase">Channel Outreach</span>
                  <p className="text-text-primary font-medium">{campaign.channel}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-[10px] text-text-secondary block font-semibold uppercase">Incentive Campaign Offer</span>
                  <p className="text-text-primary font-medium bg-card-hover p-2 rounded border border-border/40">{campaign.offer}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-text-secondary block font-semibold uppercase">Launch Timing</span>
                  <p className="text-text-primary font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-accent" /> {campaign.timing}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;
