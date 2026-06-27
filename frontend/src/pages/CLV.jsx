import React, { useState, useMemo } from 'react';
import { useMembers } from '../hooks/useData';
import { Award, DollarSign, Sparkles, TrendingUp, AlertTriangle, HelpCircle, Eye } from 'lucide-react';
import { currency, num, pct } from '../utils/formatters';

// Reusable Components
import KPICard from '../components/KPICard';
import CLVForwardScatter from '../components/CLVForwardScatter';
import ChartNarrator from '../components/ChartNarrator';
import MemberDetailModal from '../components/MemberDetailModal';

const CLV = ({ setActiveMember }) => {
  const { data: members, isLoading, isError } = useMembers();

  // Selected Member for Modal View
  const [selectedMember, setSelectedMember] = useState(null);

  // Derive counts dynamically
  const metrics = useMemo(() => {
    if (!members) return { over: 0, under: 0, accurate: 0, medianClv: 7500 };

    const active = members.filter(m => !m.cancellationYear && m.salary !== null);
    
    let over = 0;
    let under = 0;
    let accurate = 0;

    active.forEach(m => {
      const forwardScore = Math.round(m.clv * (1.15 - m.churnRisk * 0.9));
      const ratio = forwardScore / m.clv;
      if (ratio > 1.04) under++;
      else if (ratio < 0.88) over++;
      else accurate++;
    });

    const sortedClv = [...members].map(m => m.clv).sort((a, b) => a - b);
    const medianClv = sortedClv.length > 0 ? sortedClv[Math.floor(sortedClv.length / 2)] : 7500;

    return {
      over,
      under,
      accurate,
      medianClv
    };
  }, [members]);

  // Hidden Gems: top 20 by clv_forward_score where status=Underestimated (ratio > 1.04)
  const hiddenGems = useMemo(() => {
    if (!members) return [];
    return members
      .filter(m => !m.cancellationYear && m.salary !== null)
      .map(m => {
        const forwardScore = Math.round(m.clv * (1.15 - m.churnRisk * 0.9));
        const ratio = forwardScore / m.clv;
        return { ...m, forwardScore, ratio };
      })
      .filter(m => m.ratio > 1.04)
      .sort((a, b) => b.forwardScore - a.forwardScore)
      .slice(0, 20);
  }, [members]);

  // Hidden Churners: top 20 by churn_probability where clv > median
  const hiddenChurners = useMemo(() => {
    if (!members || !metrics.medianClv) return [];
    return members
      .filter(m => !m.cancellationYear && m.clv > metrics.medianClv)
      .sort((a, b) => b.churnRisk - a.churnRisk)
      .slice(0, 20);
  }, [members, metrics.medianClv]);

  const handleOpenModal = (m) => {
    setSelectedMember(m);
    setActiveMember(m); // propagate global chat context
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading CLV Projections...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-xl text-center">
        <h2 className="text-danger font-semibold mb-2">Error Loading CLV Diagnostics</h2>
        <p className="text-text-secondary text-sm">Failed to retrieve CLV projections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">CLV Valuation Analysis</h1>
        <p className="text-text-secondary text-sm">Reviewing customer lifetime value projections against predictive churn models.</p>
      </div>

      {/* Hero Header Callout */}
      <div className="card p-5 bg-card-hover/40 border border-border/80 text-xs flex gap-4 select-none leading-relaxed">
        <div className="h-10 w-10 bg-accent/15 border border-accent/20 rounded-full flex items-center justify-center shrink-0">
          <HelpCircle className="h-5 w-5 text-accent" />
        </div>
        <div className="space-y-1">
          <h2 className="font-bold text-text-primary text-sm">Is historical CLV telling the full story?</h2>
          <p className="text-text-secondary">
            Traditional CLV metrics look backwards at cumulative passenger invoice spending. By merging active churn risk multipliers, we project **Forward-Looking Value Scores** that classify members as Overestimated or latent Hidden Gems.
          </p>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title='Underestimated ("Hidden Gems")'
          value={metrics.under}
          sub="Projected Forward CLV > Historical"
          icon={TrendingUp}
          color="success"
          formatter={num}
        />
        <KPICard 
          title="Overestimated (At-Risk CLV)"
          value={metrics.over}
          sub="Churn Risk Depreciates Value"
          icon={AlertTriangle}
          color="danger"
          formatter={num}
        />
        <KPICard 
          title="Accurate Valuations"
          value={metrics.accurate}
          sub="Within Baseline Standard Limits"
          icon={Award}
          color="accent"
          formatter={num}
        />
      </div>

      {/* Scatter Chart wrapped in ChartNarrator */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
          <span>Forward CLV Projections Scatter Correlation</span>
          <span className="text-[10px] text-text-secondary">Click dot to inspect member</span>
        </h3>
        <div className="h-[360px]">
          <ChartNarrator chartType="Forward CLV status scatter plot" chartData={members}>
            <CLVForwardScatter members={members || []} colorBy="clv_status" onDotClick={handleOpenModal} />
          </ChartNarrator>
        </div>
      </div>

      {/* Dual side-by-side Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Left Table: Hidden Gems */}
        <div className="card p-5 space-y-4">
          <div className="border-b border-border/40 pb-2.5">
            <h3 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-success" /> 💎 Hidden Gems (Latent High Value)
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Top 20 underestimated active flyers sorted by projected forward CLV.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-secondary font-semibold uppercase text-[10px]">
                  <th className="py-2 px-2.5">Loyalty #</th>
                  <th className="py-2 px-2.5">Historical CLV</th>
                  <th className="py-2 px-2.5">Projected CLV</th>
                  <th className="py-2 px-2.5">Churn Risk</th>
                  <th className="py-2 px-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {hiddenGems.map((m) => (
                  <tr 
                    key={m.loyaltyNumber} 
                    onClick={() => handleOpenModal(m)}
                    className="border-b border-border/40 hover:bg-success/5 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-2.5 font-mono font-bold text-accent">#{m.loyaltyNumber}</td>
                    <td className="py-2.5 px-2.5 font-semibold text-text-primary">{currency(m.clv)}</td>
                    <td className="py-2.5 px-2.5 font-bold text-success">{currency(m.forwardScore)}</td>
                    <td className="py-2.5 px-2.5 text-text-secondary">{pct(m.churnRisk)}</td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button className="p-1 rounded hover:bg-card text-text-secondary hover:text-accent border-none bg-transparent cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Hidden Churners */}
        <div className="card p-5 space-y-4">
          <div className="border-b border-border/40 pb-2.5">
            <h3 className="text-xs font-bold text-danger uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-danger" /> 🚨 Hidden Churners (Value at Risk)
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Top 20 high-value active flyers with critical churn risk probability ratings.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-secondary font-semibold uppercase text-[10px]">
                  <th className="py-2 px-2.5">Loyalty #</th>
                  <th className="py-2 px-2.5">Historical CLV</th>
                  <th className="py-2 px-2.5">Churn Probability</th>
                  <th className="py-2 px-2.5">Segment</th>
                  <th className="py-2 px-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {hiddenChurners.map((m) => (
                  <tr 
                    key={m.loyaltyNumber} 
                    onClick={() => handleOpenModal(m)}
                    className="border-b border-border/40 hover:bg-danger/5 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-2.5 font-mono font-bold text-accent">#{m.loyaltyNumber}</td>
                    <td className="py-2.5 px-2.5 font-bold text-text-primary">{currency(m.clv)}</td>
                    <td className="py-2.5 px-2.5 font-bold text-danger">{pct(m.churnRisk)}</td>
                    <td className="py-2.5 px-2.5 text-text-secondary">{m.segment}</td>
                    <td className="py-2.5 px-2.5 text-right">
                      <button className="p-1 rounded hover:bg-card text-text-secondary hover:text-accent border-none bg-transparent cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insight Cards (2 explanation blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none text-xs">
        <div className="p-4 bg-card/60 border-l-4 border-success rounded-r-lg space-y-2 leading-relaxed">
          <span className="font-bold text-success uppercase text-[10px] block flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-success" /> Business Value of Hidden Gems
          </span>
          <p className="text-text-secondary">
            These flyers have stable booking frequencies and low cancellation scores but hold highly values of loyalty card status. They require loyalty promotions and exclusive event options to maintain long-term account values.
          </p>
        </div>

        <div className="p-4 bg-card/60 border-l-4 border-danger rounded-r-lg space-y-2 leading-relaxed">
          <span className="font-bold text-danger uppercase text-[10px] block flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-danger" /> Risks of Overestimated Passengers
          </span>
          <p className="text-text-secondary">
            Traditional CRM audits value these accounts highly because of their cumulative flight history. However, their high churn probability ratings suggest a high likelihood of opting out, putting significant value at risk of immediate loss.
          </p>
        </div>
      </div>

      {/* Modal Detail Overlay */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};

export default CLV;
