import React, { useState, useMemo } from 'react';
import { useMembers, useStats, useFeatureImportance } from '../hooks/useData';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  MapPin, 
  Award, 
  BarChart3,
  Calendar,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { currency, num, pct } from '../utils/formatters';

// Reusable Components
import KPICard from '../components/KPICard';
import ChurnGauge from '../components/ChurnGauge';
import ChurnHistogram from '../components/ChurnHistogram';
import ProvinceBarChart from '../components/ProvinceBarChart';
import CLVScatterChart from '../components/CLVScatterChart';
import LoyaltyCardDonut from '../components/LoyaltyCardDonut';
import FlightTrendChart from '../components/FlightTrendChart';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import ChartNarrator from '../components/ChartNarrator';
import MemberDetailModal from '../components/MemberDetailModal';

const Dashboard = ({ setActiveMember }) => {
  const { data: members, isLoading: membersLoading, isError: membersError } = useMembers();
  const { data: stats } = useStats();
  const { data: features } = useFeatureImportance();

  // Load monthly flights
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthlyFlights'],
    queryFn: () => fetch('./data/monthly_flights.json').then(res => {
      if (!res.ok) throw new Error('Failed to load flights trend');
      return res.json();
    })
  });

  // Cross-filtering States
  const [filters, setFilters] = useState({
    segment: 'all',
    churn_risk: 'all',
    province: 'all',
    card_tier: 'all',
    clvMin: 0,
    clvMax: 100000,
    search: '',
    churnProbabilityMin: 0,
    churnProbabilityMax: 1
  });
  
  const [sort, setSort] = useState({ key: 'churnRisk', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [activeChart, setActiveChart] = useState(null); // tracks which chart was clicked

  // Details Modal State
  const [selectedMember, setSelectedMember] = useState(null);

  // Derive top provinces lists, card lists, segments lists for filter checks
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    
    return members.filter(m => {
      // 1. Churn Risk (High/Medium/Low pills)
      if (filters.churn_risk !== 'all') {
        const r = m.churnRisk;
        if (filters.churn_risk === 'High' && r < 0.7) return false;
        if (filters.churn_risk === 'Medium' && (r < 0.3 || r >= 0.7)) return false;
        if (filters.churn_risk === 'Low' && r >= 0.3) return false;
      }

      // 2. Churn Risk Range (Histogram bucket)
      if (m.churnRisk < filters.churnProbabilityMin || m.churnRisk > filters.churnProbabilityMax) {
        return false;
      }

      // 3. Province
      if (filters.province !== 'all' && m.province !== filters.province) {
        return false;
      }

      // 4. Card Tier
      if (filters.card_tier !== 'all' && m.card !== filters.card_tier) {
        return false;
      }

      // 5. Segment
      if (filters.segment !== 'all' && m.segment !== filters.segment) {
        return false;
      }

      // 6. CLV bounds
      if (m.clv < filters.clvMin || m.clv > filters.clvMax) {
        return false;
      }

      // 7. Search text
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches = 
          m.loyaltyNumber.toString().includes(term) ||
          m.city.toLowerCase().includes(term) ||
          m.province.toLowerCase().includes(term);
        if (!matches) return false;
      }

      return true;
    });
  }, [members, filters]);

  // Derived KPIs from filtered members
  const derivedStats = useMemo(() => {
    const total = filteredMembers.length;
    if (total === 0) {
      return { total: 0, active: 0, churnRate: 0, avgClv: 0, highRiskCount: 0 };
    }

    const cancelled = filteredMembers.filter(m => m.cancellationYear).length;
    const active = total - cancelled;
    const churnRate = cancelled / total;
    
    const sumClv = filteredMembers.reduce((sum, m) => sum + m.clv, 0);
    const avgClv = sumClv / total;

    const highRiskCount = filteredMembers.filter(m => !m.cancellationYear && m.churnRisk >= 0.7).length;

    return {
      total,
      active,
      churnRate,
      avgClv,
      highRiskCount
    };
  }, [filteredMembers]);

  // Sorting
  const sortedMembers = useMemo(() => {
    const data = [...filteredMembers];
    if (!sort.key) return data;

    data.sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sort.dir === 'asc' 
        ? aVal.toString().localeCompare(bVal.toString()) 
        : bVal.toString().localeCompare(aVal.toString());
    });
    return data;
  }, [filteredMembers, sort]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / itemsPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedMembers.slice(start, start + itemsPerPage);
  }, [sortedMembers, page]);

  // Trigger page resets when filters change
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      segment: 'all',
      churn_risk: 'all',
      province: 'all',
      card_tier: 'all',
      clvMin: 0,
      clvMax: 100000,
      search: '',
      churnProbabilityMin: 0,
      churnProbabilityMax: 1
    });
    setPage(1);
    setActiveChart(null);
  };

  // Cross filtering chart handlers
  const handleProvinceClick = (province) => {
    setActiveChart('province');
    updateFilters({ province: filters.province === province ? 'all' : province });
  };

  const handleCardClick = (card) => {
    setActiveChart('card');
    updateFilters({ card_tier: filters.card_tier === card ? 'all' : card });
  };

  const handleBucketClick = (range) => {
    setActiveChart('risk_histogram');
    if (filters.churnProbabilityMin === range.min && filters.churnProbabilityMax === range.max) {
      updateFilters({ churnProbabilityMin: 0, churnProbabilityMax: 1 });
    } else {
      updateFilters({ churnProbabilityMin: range.min, churnProbabilityMax: range.max });
    }
  };

  const handleDotClick = (member) => {
    setSelectedMember(member);
    setActiveMember(member); // propagate active member context globally
  };

  const requestSort = (key) => {
    let dir = 'asc';
    if (sort.key === key && sort.dir === 'asc') {
      dir = 'desc';
    }
    setSort({ key, dir });
  };

  if (membersLoading || monthlyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading visual database charts...</p>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-xl text-center">
        <h2 className="text-danger font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-text-secondary text-sm">Failed to retrieve program database metrics.</p>
      </div>
    );
  }

  const hasActiveFilters = 
    filters.segment !== 'all' || 
    filters.churn_risk !== 'all' || 
    filters.province !== 'all' || 
    filters.card_tier !== 'all' || 
    filters.search !== '' ||
    filters.churnProbabilityMin !== 0 ||
    filters.churnProbabilityMax !== 1 ||
    filters.clvMin !== 0 ||
    filters.clvMax !== 100000;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Analytics Dashboard</h1>
          <p className="text-text-secondary text-sm">Interactive cross-filtering suite for CRM flight risk analysis.</p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/15 border border-accent/20 text-accent hover:bg-accent/20 active:scale-95 transition-all select-none cursor-pointer"
          >
            Clear All Active Filters
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center text-xs count-up select-none">
          <span className="text-text-secondary flex items-center gap-1 font-semibold"><Filter className="h-3.5 w-3.5" /> Filters:</span>
          {filters.province !== 'all' && (
            <span className="badge-accent flex items-center gap-1 bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded text-[11px] font-semibold">
              Province: {filters.province}
              <button onClick={() => updateFilters({ province: 'all' })} className="hover:text-text-primary ml-1 text-accent font-bold">✕</button>
            </span>
          )}
          {filters.card_tier !== 'all' && (
            <span className="badge-accent flex items-center gap-1 bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded text-[11px] font-semibold">
              Card: {filters.card_tier}
              <button onClick={() => updateFilters({ card_tier: 'all' })} className="hover:text-text-primary ml-1 text-accent font-bold">✕</button>
            </span>
          )}
          {(filters.churnProbabilityMin !== 0 || filters.churnProbabilityMax !== 1) && (
            <span className="badge-accent flex items-center gap-1 bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded text-[11px] font-semibold">
              Risk Range: {Math.round(filters.churnProbabilityMin * 100)}%-{Math.round(filters.churnProbabilityMax * 100)}%
              <button onClick={() => updateFilters({ churnProbabilityMin: 0, churnProbabilityMax: 1 })} className="hover:text-text-primary ml-1 text-accent font-bold">✕</button>
            </span>
          )}
          {filters.segment !== 'all' && (
            <span className="badge-accent flex items-center gap-1 bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded text-[11px] font-semibold">
              Segment: {filters.segment}
              <button onClick={() => updateFilters({ segment: 'all' })} className="hover:text-text-primary ml-1 text-accent font-bold">✕</button>
            </span>
          )}
          {filters.churn_risk !== 'all' && (
            <span className="badge-accent flex items-center gap-1 bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded text-[11px] font-semibold">
              Priority: {filters.churn_risk}
              <button onClick={() => updateFilters({ churn_risk: 'all' })} className="hover:text-text-primary ml-1 text-accent font-bold">✕</button>
            </span>
          )}
          {filters.search && (
            <span className="badge-accent flex items-center gap-1 bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded text-[11px] font-semibold">
              Search: "{filters.search}"
              <button onClick={() => updateFilters({ search: '' })} className="hover:text-text-primary ml-1 text-accent font-bold">✕</button>
            </span>
          )}
        </div>
      )}

      {/* KPI Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          title="Filtered Members"
          value={derivedStats.total}
          sub="Active In Selection"
          icon={Users}
          color="accent"
          formatter={num}
        />
        <KPICard 
          title="Active Flyers"
          value={derivedStats.active}
          sub="Excludes Opt-Outs"
          icon={CheckCircle2}
          color="success"
          formatter={num}
        />
        <KPICard 
          title="Avg Churn Risk"
          value={derivedStats.churnRate * 100}
          sub="Risk Exposure %"
          icon={ShieldAlert}
          color="danger"
          formatter={(val) => val.toFixed(1) + '%'}
        />
        <KPICard 
          title="Average CLV"
          value={derivedStats.avgClv}
          sub="Invoiced Value CAD"
          icon={TrendingUp}
          color="accent"
          formatter={currency}
        />
        <KPICard 
          title="High Risk Members"
          value={derivedStats.highRiskCount}
          sub="Probability &gt; 70%"
          icon={ShieldAlert}
          color="warning"
          formatter={num}
        />
      </div>

      {/* INTERACTIVE CHART GRID */}
      {/* Row 1: 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. ProvinceBarChart */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
            <span className="flex items-center gap-1.5"><MapPin className="h-4.5 w-4.5 text-accent" /> Churn Risk by Province</span>
            {filters.province !== 'all' && <span className="text-[10px] text-accent lowercase">Click bar again to clear</span>}
          </h3>
          <ChartNarrator chartType="Province Distribution Composed" chartData={filteredMembers}>
            <ProvinceBarChart members={filteredMembers} onBarClick={handleProvinceClick} />
          </ChartNarrator>
        </div>

        {/* 2. LoyaltyCardDonut */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
            <span className="flex items-center gap-1.5"><Award className="h-4.5 w-4.5 text-accent" /> Loyalty Card Distribution</span>
            {filters.card_tier !== 'all' && <span className="text-[10px] text-accent lowercase">Click slice again to clear</span>}
          </h3>
          <ChartNarrator chartType="Card Distribution Pie" chartData={filteredMembers}>
            <LoyaltyCardDonut members={filteredMembers} onSliceClick={handleCardClick} />
          </ChartNarrator>
        </div>

        {/* 3. ChurnHistogram */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
            <span className="flex items-center gap-1.5"><BarChart3 className="h-4.5 w-4.5 text-accent" /> Churn Probability Buckets</span>
            {(filters.churnProbabilityMin !== 0 || filters.churnProbabilityMax !== 1) && <span className="text-[10px] text-accent lowercase">Click bucket again to clear</span>}
          </h3>
          <ChartNarrator chartType="Churn Risk Histogram" chartData={filteredMembers}>
            <ChurnHistogram members={filteredMembers} onBucketClick={handleBucketClick} />
          </ChartNarrator>
        </div>

        {/* 4. CLVScatterChart */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
            <span className="flex items-center gap-1.5"><TrendingUp className="h-4.5 w-4.5 text-accent" /> Churn vs CLV (Salary Samples)</span>
            <span className="text-[10px] text-text-secondary lowercase">Click dot to inspect member</span>
          </h3>
          <ChartNarrator chartType="CLV vs Risk Correlation Scatter" chartData={filteredMembers}>
            <CLVScatterChart members={filteredMembers} colorBy="churn_risk" onDotClick={handleDotClick} />
          </ChartNarrator>
        </div>
      </div>

      {/* Row 2: 2x1 Grid Section (FlightTrendChart takes full height or is side-by-side) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
            <span className="flex items-center gap-1.5"><Calendar className="h-4.5 w-4.5 text-accent" /> Monthly Booking Timeline Trends</span>
            <span className="text-[10px] text-text-secondary lowercase">Use brush zoom at bottom</span>
          </h3>
          <ChartNarrator chartType="Flight Trend Over Time" chartData={monthlyData}>
            <FlightTrendChart data={monthlyData || []} />
          </ChartNarrator>
        </div>
      </div>

      {/* Row 3: FeatureImportanceChart Full Width */}
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2 select-none">
          <span className="flex items-center gap-1.5"><Sparkles className="h-4.5 w-4.5 text-accent" /> Key Predictor Feature Coefficients</span>
        </h3>
        <ChartNarrator chartType="Logistic Feature Weights" chartData={features}>
          <FeatureImportanceChart data={features || []} />
        </ChartNarrator>
      </div>

      {/* Filtered Members Table */}
      <div className="card p-5 space-y-4 select-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Filtered CRM Records</h3>
            <p className="text-text-secondary text-xs mt-0.5">Showing {num(derivedStats.total)} of {num(members?.length || 0)} members</p>
          </div>

          {/* Search bar inside table headers */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Filter by ID, city, province..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full bg-bg border border-border rounded-lg pl-8 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary"
            />
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-xs text-left border-collapse leading-normal">
            <thead>
              <tr className="border-b border-border/60 text-text-secondary font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">
                  <button onClick={() => requestSort('loyaltyNumber')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                    Loyalty # <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-2.5 px-3">
                  <button onClick={() => requestSort('churnRisk')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                    Churn Probability <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-2.5 px-3">
                  <button onClick={() => requestSort('segment')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                    Segment <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-2.5 px-3">
                  <button onClick={() => requestSort('card')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                    Card Tier <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-2.5 px-3">
                  <button onClick={() => requestSort('province')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                    Province <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-2.5 px-3">
                  <button onClick={() => requestSort('clv')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                    CLV <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((m) => (
                  <tr 
                    key={m.loyaltyNumber} 
                    className="border-b border-border/40 hover:bg-card-hover/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-accent">{m.loyaltyNumber}</td>
                    <td className="py-3 px-3">
                      {m.cancellationYear ? (
                        <span className="text-danger font-semibold">100% (Churned)</span>
                      ) : (
                        <span className={`font-semibold ${
                          m.churnRisk >= 0.7 
                            ? 'text-danger' 
                            : m.churnRisk >= 0.3 
                              ? 'text-warning' 
                              : 'text-success'
                        }`}>
                          {pct(m.churnRisk)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-text-primary">{m.segment}</td>
                    <td className="py-3 px-3">
                      <span className="bg-bg border border-border px-2 py-0.5 rounded text-[11px]">
                        {m.card}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary">{m.province}</td>
                    <td className="py-3 px-3 font-semibold text-text-primary">{currency(m.clv)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDotClick(m)}
                        className="bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent text-accent px-2 py-1 rounded flex items-center gap-1 active:scale-95 transition-all text-[11px] cursor-pointer inline-flex ml-auto"
                      >
                        <Eye className="h-3 w-3" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-secondary">
                    No matching members found inside this filtered cohort.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-3 border-t border-border/40 text-xs">
            <span className="text-text-secondary">
              Page <span className="font-semibold text-text-primary">{page}</span> of{' '}
              <span className="font-semibold text-text-primary">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
