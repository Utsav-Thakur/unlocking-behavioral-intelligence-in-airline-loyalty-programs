import React from 'react';
import { useStats } from '../hooks/useData';
import { currency, num, pct } from '../utils/formatters';
import { 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Brain, 
  ArrowUpRight,
  Plane,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import KPICard from '../components/KPICard';
import ConfusionMatrix from '../components/ConfusionMatrix';
import LoyaltyCardDonut from '../components/LoyaltyCardDonut';

const Overview = () => {
  const { data: stats, isLoading, isError, error } = useStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading loyalty statistics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-xl text-center">
        <h2 className="text-danger font-semibold mb-2">Error Loading Data</h2>
        <p className="text-text-secondary text-sm">{error?.message || "Failed to load loyalty dataset."}</p>
      </div>
    );
  }

  const {
    total,
    high_risk,
    avg_clv,
    seg_breakdown,
  } = stats;

  const churnCount = seg_breakdown["Dormant / Churned"] || 0;
  const activeCount = total - churnCount;
  const churnRate = total > 0 ? churnCount / total : 0;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Overview</h1>
        <p className="text-text-secondary text-sm">LoyaltyIQ executive summary dashboard and model telemetry.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          title="Total Passengers"
          value={total}
          sub="CRM Database Count"
          icon={Users}
          color="accent"
          formatter={num}
        />
        <KPICard 
          title="Active Members"
          value={activeCount}
          sub={`${pct(1 - churnRate)} Engagement`}
          icon={CheckCircle2}
          color="success"
          formatter={num}
          trend="+"
          delta={pct(1 - churnRate)}
        />
        <KPICard 
          title="Average CLV"
          value={avg_clv}
          sub="Customer Value Index"
          icon={TrendingUp}
          color="accent"
          formatter={currency}
        />
        <KPICard 
          title="Cancellation Rate"
          value={churnCount}
          sub="Total Opt-Out Accounts"
          icon={ShieldAlert}
          color="danger"
          formatter={num}
          trend="-"
          delta={pct(churnRate)}
        />
        <KPICard 
          title="At High Risk"
          value={high_risk}
          sub="Churn Probability &gt; 70%"
          icon={ShieldAlert}
          color="warning"
          formatter={num}
        />
      </div>

      {/* Main Grid: Telemetry & Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Model Performance - Confusion Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Brain className="h-5 w-5 text-accent" /> Churn Predictor Telemetry
                </h2>
                <span className="text-[10px] text-success border border-success/30 bg-success/15 px-2 py-0.5 rounded-full font-medium">
                  Active Model v1.0
                </span>
              </div>
              <p className="text-text-secondary text-xs mb-6">
                Model performance evaluated using the validation cohort. The XGBoost model achieves high precision (98.2%) to prevent false retention spend on loyal passengers.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-bg border border-border rounded-lg text-center">
                  <span className="text-[10px] text-text-secondary block font-medium uppercase tracking-wider">ROC AUC</span>
                  <span className="text-xl font-bold text-accent block mt-1 font-display">0.941</span>
                </div>
                <div className="p-3.5 bg-bg border border-border rounded-lg text-center">
                  <span className="text-[10px] text-text-secondary block font-medium uppercase tracking-wider">F1-Score</span>
                  <span className="text-xl font-bold text-text-primary block mt-1 font-display">0.799</span>
                </div>
                <div className="p-3.5 bg-bg border border-border rounded-lg text-center">
                  <span className="text-[10px] text-text-secondary block font-medium uppercase tracking-wider">Precision</span>
                  <span className="text-xl font-bold text-success block mt-1 font-display">0.982</span>
                </div>
                <div className="p-3.5 bg-bg border border-border rounded-lg text-center">
                  <span className="text-[10px] text-text-secondary block font-medium uppercase tracking-wider">Recall</span>
                  <span className="text-xl font-bold text-warning block mt-1 font-display">0.674</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs">
              <span className="text-text-secondary">Explore churn indicators and features:</span>
              <Link to="/churn" className="text-accent hover:underline flex items-center gap-1 font-medium">
                Churn Explorer <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Model Confusion Matrix */}
          <ConfusionMatrix />
        </div>

        {/* Loyalty Tier Distribution Donut */}
        <div className="card p-6 flex flex-col justify-between h-fit">
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" /> Card Tier Distribution
            </h2>
            <p className="text-text-secondary text-xs mb-4">
              Distribution of loyalty membership cards. Elite Aurora cards display the lowest cancellation ratios.
            </p>

            <LoyaltyCardDonut members={[]} />
          </div>

          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs">
            <span className="text-text-secondary">Analyze segments details:</span>
            <Link to="/segments" className="text-accent hover:underline flex items-center gap-1 font-medium">
              Segment Summary <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="card p-6 bg-gradient-to-r from-card-hover to-card border border-border/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent/15 p-3 rounded-xl border border-accent/25">
            <Plane className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-text-primary">Need a retention marketing campaign?</h3>
            <p className="text-text-secondary text-xs">Draft custom engagement offers and simulate churn rate offsets in our workspace.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/retention" 
            className="bg-card border border-border text-text-primary px-4 py-2 rounded-lg text-xs font-semibold hover:bg-card-hover hover:border-accent/40 active:scale-95 transition-all"
          >
            Retention Simulations
          </Link>
          <Link 
            to="/ai" 
            className="bg-accent text-bg px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all ai-glow"
          >
            ✦ AI Strategy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Overview;
