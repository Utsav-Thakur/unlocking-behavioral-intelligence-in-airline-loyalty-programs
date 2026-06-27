import React, { useState } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { num, pct } from '../utils/formatters';

// Reusable Components
import ConfusionMatrix from '../components/ConfusionMatrix';
import ChartNarrator from '../components/ChartNarrator';

const Anomalies = () => {
  // Expandable states for the 4 anomaly cards
  const [expandedCard, setExpandedCard] = useState(null);

  const handleToggleExpand = (id) => {
    setExpandedCard(prev => (prev === id ? null : id));
  };

  const anomaliesList = [
    {
      id: 'post_cancel',
      title: 'Post-Cancellation Flights',
      count: 1995,
      icon: ShieldAlert,
      iconColor: 'text-danger',
      borderColor: 'border-danger',
      decision: 'Discarded post-cancellation flight logs from classifier telemetry.',
      why: 'Flights registered after cancellation indicate data logging system lags or fraudulent boarding pass usage, which corrupts model retention baseline parameters.'
    },
    {
      id: 'ghost',
      title: 'Ghost Members (Zero Demographics)',
      count: 1570,
      icon: AlertTriangle,
      iconColor: 'text-warning',
      borderColor: 'border-warning',
      decision: 'Imputed median city/province defaults based on postal codes.',
      why: 'Missing critical identifiers like gender, education, and marital status creates model training gaps, resolved through demographic neighborhood proximity averages.'
    },
    {
      id: 'salary',
      title: 'Salary Imputed Outliers',
      count: 4238,
      icon: HelpCircle,
      iconColor: 'text-accent',
      borderColor: 'border-accent',
      decision: 'Imputed null salaries with regional/education group medians.',
      why: 'Missing salary variables represent over 25% of CRM profiles. Dropping them would introduce systemic class bias; group imputation retains cohort integrity.'
    },
    {
      id: 'negative',
      title: 'Negative Value Logging',
      count: 0,
      icon: CheckCircle,
      iconColor: 'text-success',
      borderColor: 'border-success',
      decision: 'Enforced bounds validation checking that flight distances and points accrued >= 0.',
      why: 'Negative logs represent database overflow corruptions. Verification audits confirm zero instances in the production stream.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Data Quality & Anomalies</h1>
        <p className="text-text-secondary text-sm">Audited integrity report on airline CRM demographics and flight activities.</p>
      </div>

      {/* 4 Anomaly Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {anomaliesList.map(anom => {
          const IconComp = anom.icon;
          const isExpanded = expandedCard === anom.id;

          return (
            <div 
              key={anom.id} 
              className={`card p-4 flex flex-col justify-between border-l-4 border-l-${anom.borderColor} hover:border-accent/40 transition-all cursor-pointer count-up`}
              onClick={() => handleToggleExpand(anom.id)}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <IconComp className={`h-5 w-5 ${anom.iconColor}`} />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    anom.count > 0 
                      ? 'bg-danger/10 text-danger border border-danger/25'
                      : 'bg-success/10 text-success border border-success/25'
                  }`}>
                    {num(anom.count)} Flags
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">{anom.title}</h3>
                  <p className="text-[11px] text-text-secondary mt-1"><strong className="text-text-primary">Decision:</strong> {anom.decision}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/20 mt-3 flex justify-between items-center text-[10px] text-text-secondary font-semibold">
                <span>{isExpanded ? 'Hide Details' : 'Why it matters'}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>

              {/* Expandable Why It Matters */}
              {isExpanded && (
                <div className="mt-2 text-[11px] text-text-secondary leading-normal bg-bg/50 p-2.5 rounded border border-border/40 count-up">
                  {anom.why}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confusion Matrix full width */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2">
          <span>XGBoost Classification Confusion Grid</span>
        </h3>
        <div className="w-full">
          <ChartNarrator chartType="XGBoost Confusion Matrix" chartData={[]}>
            <ConfusionMatrix />
          </ChartNarrator>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Churn Definition Card */}
        <div className="card p-5 space-y-4 text-xs">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-accent" /> Churn Target Definition Logic
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">How customer disengagement is mathematically structured in the dataset.</p>
          </div>

          <div className="space-y-3 leading-relaxed">
            <div className="bg-bg/40 p-3 rounded border border-border/50 border-l-4 border-l-accent">
              <strong className="text-text-primary font-semibold block text-[11px] uppercase tracking-wide">1. Explicit Cancellation</strong>
              <p className="text-text-secondary mt-0.5">
                Any member profile containing a non-null <strong className="text-text-primary">Cancellation Year</strong> is marked as churned (Risk 1.0).
              </p>
            </div>
            
            <div className="bg-bg/40 p-3 rounded border border-border/50 border-l-4 border-l-accent">
              <strong className="text-text-primary font-semibold block text-[11px] uppercase tracking-wide">2. Implicit Activity Dormancy</strong>
              <p className="text-text-secondary mt-0.5">
                Passengers who show no flight bookings, points accumulated, or points redeemed in the final 90 days of the observation window.
              </p>
            </div>

            <div className="bg-bg/40 p-3 rounded border border-border/50 border-l-4 border-l-accent">
              <strong className="text-text-primary font-semibold block text-[11px] uppercase tracking-wide">3. Baseline Cutoff date</strong>
              <p className="text-text-secondary mt-0.5">
                Enrollments prior to 2017 are used to prevent short-term account noise, evaluating activity strictly between 2017 and 2018.
              </p>
            </div>
          </div>
        </div>

        {/* Model Performance Table */}
        <div className="card p-5 space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-4.5 w-4.5 text-accent animate-pulse" /> ML Classifier Telemetry Results
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Evaluation metrics of the trained XGBoost model under 5-fold cross-validation.</p>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-secondary font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Evaluation Metric</th>
                  <th className="py-2.5 px-3">Accuracy Score</th>
                  <th className="py-2.5 px-3">Evaluation Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/40 hover:bg-card-hover/20">
                  <td className="py-3 px-3 font-semibold text-text-primary">ROC-AUC</td>
                  <td className="py-3 px-3 font-bold text-accent">0.941</td>
                  <td className="py-3 px-3 text-text-secondary">Excellent discrimination between loyal flyers and churn risks.</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-card-hover/20">
                  <td className="py-3 px-3 font-semibold text-text-primary">F1-Score</td>
                  <td className="py-3 px-3 font-bold text-success">0.799</td>
                  <td className="py-3 px-3 text-text-secondary">Optimal harmonic mean balancing precision and recall constraints.</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-card-hover/20">
                  <td className="py-3 px-3 font-semibold text-text-primary">Precision</td>
                  <td className="py-3 px-3 font-bold text-accent">0.982</td>
                  <td className="py-3 px-3 text-text-secondary">Extremely low false alarm rates (only 1.8% of targeted offers wasted).</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-card-hover/20">
                  <td className="py-3 px-3 font-semibold text-text-primary">Recall</td>
                  <td className="py-3 px-3 font-bold text-warning">0.674</td>
                  <td className="py-3 px-3 text-text-secondary">Identifies 67.4% of total potential cancellations before opt-out.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Anomalies;
