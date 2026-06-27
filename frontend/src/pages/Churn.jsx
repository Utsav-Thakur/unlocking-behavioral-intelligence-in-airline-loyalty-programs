import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMembers, useStats } from '../hooks/useData';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Eye, 
  ArrowUpDown, 
  Download, 
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { currency, num, pct, riskClass } from '../utils/formatters';

// Reusable Components
import ChurnHistogram from '../components/ChurnHistogram';
import MemberDetailModal from '../components/MemberDetailModal';
import ChartNarrator from '../components/ChartNarrator';

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

const Churn = ({ setActiveMember }) => {
  const { data: members, isLoading, isError } = useMembers();
  const location = useLocation();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegments, setSelectedSegments] = useState([]); // Array of strings (e.g. ['Elite Loyalists'])
  const [selectedRisks, setSelectedRisks] = useState([]); // Array of strings: 'High', 'Medium', 'Low'
  
  // Handle location state pre-filtering
  useEffect(() => {
    if (location.state) {
      if (location.state.prefilteredSegment) {
        setSelectedSegments([location.state.prefilteredSegment]);
      }
      if (location.state.prefilteredPriority) {
        setSelectedRisks([location.state.prefilteredPriority]);
      }
    }
  }, [location.state]);
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [clvMinInput, setClvMinInput] = useState('0');
  const [clvMaxInput, setClvMaxInput] = useState('100000');
  
  // Custom Risk Range from Histogram Clicks
  const [riskRangeMin, setRiskRangeMin] = useState(0);
  const [riskRangeMax, setRiskRangeMax] = useState(1);

  // Sorting State
  const [sort, setSort] = useState({ key: 'churnRisk', dir: 'desc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Detail Modal State
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);

  // Provinces List
  const provinces = [
    'All', 'Ontario', 'British Columbia', 'Quebec', 'Alberta', 
    'Manitoba', 'New Brunswick', 'Nova Scotia', 'Saskatchewan', 
    'Newfoundland', 'Prince Edward Island', 'Yukon'
  ];

  // CLV Range parsing & validation
  const clvMin = parseFloat(clvMinInput) || 0;
  const clvMax = parseFloat(clvMaxInput) || 100000;
  const isClvRangeValid = clvMin >= 0 && clvMax >= clvMin;

  // Toggle helpers
  const handleToggleSegment = (seg) => {
    setSelectedSegments(prev => 
      prev.includes(seg) ? prev.filter(x => x !== seg) : [...prev, seg]
    );
    setCurrentPage(1);
  };

  const handleToggleRisk = (risk) => {
    setSelectedRisks(prev => 
      prev.includes(risk) ? prev.filter(x => x !== risk) : [...prev, risk]
    );
    setCurrentPage(1);
  };

  // Histogram click bucket adds to active risk ranges
  const handleHistogramBucketClick = (range) => {
    if (riskRangeMin === range.min && riskRangeMax === range.max) {
      setRiskRangeMin(0);
      setRiskRangeMax(1);
    } else {
      setRiskRangeMin(range.min);
      setRiskRangeMax(range.max);
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSegments([]);
    setSelectedRisks([]);
    setSelectedProvince('All');
    setClvMinInput('0');
    setClvMaxInput('100000');
    setRiskRangeMin(0);
    setRiskRangeMax(1);
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    return members.filter(m => {
      // 1. Search Query (Matches Loyalty Number, City, or Province)
      const matchesSearch = 
        !searchQuery ||
        m.loyaltyNumber.toString().includes(searchQuery) ||
        m.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.province.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Segment multiselect
      const matchesSegment = 
        selectedSegments.length === 0 || 
        selectedSegments.includes(m.segment);

      // 3. Churn Risk category multiselect
      let matchesRisk = true;
      if (selectedRisks.length > 0) {
        const risk = m.churnRisk;
        matchesRisk = selectedRisks.some(r => {
          if (r === 'High') return risk >= 0.7;
          if (r === 'Medium') return risk >= 0.3 && risk < 0.7;
          if (r === 'Low') return risk < 0.3;
          return true;
        });
      }

      // 4. Histogram Risk Range
      const matchesHistogramRange = m.churnRisk >= riskRangeMin && m.churnRisk <= riskRangeMax;

      // 5. Province dropdown
      const matchesProvince = selectedProvince === 'All' || m.province === selectedProvince;

      // 6. CLV ranges
      const matchesClv = m.clv >= clvMin && m.clv <= clvMax;

      return matchesSearch && matchesSegment && matchesRisk && matchesHistogramRange && matchesProvince && matchesClv;
    });
  }, [members, searchQuery, selectedSegments, selectedRisks, riskRangeMin, riskRangeMax, selectedProvince, clvMin, clvMax]);

  // Derived metrics counts
  const totalCount = members?.length || 0;
  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    selectedSegments.length + 
    selectedRisks.length + 
    (selectedProvince !== 'All' ? 1 : 0) +
    (riskRangeMin !== 0 || riskRangeMax !== 1 ? 1 : 0) +
    (clvMin !== 0 || clvMax !== 100000 ? 1 : 0);

  // Sorting
  const sortedMembers = useMemo(() => {
    const data = [...filteredMembers];
    if (!sort.key) return data;

    data.sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];

      // Handle nulls
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (sort.key === 'forwardScore') {
        aVal = Math.round(a.clv * (1.15 - a.churnRisk * 0.9));
        bVal = Math.round(b.clv * (1.15 - b.churnRisk * 0.9));
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sort.dir === 'asc' 
        ? aVal.toString().localeCompare(bVal.toString()) 
        : bVal.toString().localeCompare(aVal.toString());
    });
    return data;
  }, [filteredMembers, sort]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / itemsPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedMembers.slice(start, start + itemsPerPage);
  }, [sortedMembers, currentPage]);

  const requestSort = (key) => {
    let dir = 'asc';
    if (sort.key === key && sort.dir === 'asc') {
      dir = 'desc';
    }
    setSort({ key, dir });
  };

  const handleOpenDetailModal = (member) => {
    setSelectedMemberDetail(member);
    setActiveMember(member); // set global assistant context
  };

  // CSV Exporter using URL.createObjectURL & Blob (No package required, zero Storage API)
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;

    const headers = 'Loyalty Number,Churn Probability,Segment,CLV,Forward CLV Score,Last Active,Priority,City,Province,Card Tier\n';
    
    const rows = filteredMembers.map(m => {
      const forwardScore = Math.round(m.clv * (1.15 - m.churnRisk * 0.9));
      const lastActiveText = m.cancellationYear ? `Cancelled ${m.cancellationYear}` : m.totalFlights > 15 ? 'Active' : 'Dormant';
      const priority = m.churnRisk >= 0.7 ? 'High' : m.churnRisk >= 0.3 ? 'Medium' : 'Low';
      return `"${m.loyaltyNumber}","${m.churnRisk}","${m.segment}","${m.clv}","${forwardScore}","${lastActiveText}","${priority}","${m.city}","${m.province}","${m.card}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `loyalty_iq_churn_explorer_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        <p className="text-text-secondary text-sm">Loading Churn Explorer registers...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-xl text-center">
        <h2 className="text-danger font-semibold mb-2">Error Loading Churn Registers</h2>
        <p className="text-text-secondary text-sm">Failed to retrieve matching passenger files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Churn Explorer</h1>
        <p className="text-text-secondary text-sm">Advanced segmentation queries and predictive classifier logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start select-none">
        
        {/* Sticky Filter Panel (Left) */}
        <div className="card p-5 space-y-5 lg:col-span-1 lg:sticky lg:top-24 h-fit">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-4 w-4 text-accent" /> Control Filters
            </h3>
            {activeFiltersCount > 0 && (
              <span className="bg-accent/15 text-accent border border-accent/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                {activeFiltersCount} Active
              </span>
            )}
          </div>

          {/* Search ID */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase">Search Loyalty ID</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
              <input
                type="text"
                placeholder="ID, City or Province..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-bg border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary"
              />
            </div>
          </div>

          {/* Segment Multiselect */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase">Loyalty Segment</span>
            <div className="flex flex-col gap-1.5 text-xs">
              {['Elite Loyalists', 'At-Risk Flyers', 'Casual Travelers', 'Standard Members'].map(seg => (
                <button
                  key={seg}
                  onClick={() => handleToggleSegment(seg)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-all ${
                    selectedSegments.includes(seg)
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'bg-bg border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          {/* Churn Risk Level Multiselect */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase">Churn Risk Level</span>
            <div className="flex gap-1.5 flex-wrap">
              {['High', 'Medium', 'Low'].map(risk => (
                <button
                  key={risk}
                  onClick={() => handleToggleRisk(risk)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    selectedRisks.includes(risk)
                      ? risk === 'High' 
                        ? 'bg-danger/15 border-danger/40 text-danger'
                        : risk === 'Medium'
                          ? 'bg-warning/15 border-warning/40 text-warning'
                          : 'bg-success/15 border-success/40 text-success'
                      : 'bg-bg border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {/* Province Dropdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase">Canadian Region</span>
            <select
              value={selectedProvince}
              onChange={(e) => { setSelectedProvince(e.target.value); setCurrentPage(1); }}
              className="w-full bg-bg border border-border rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              {provinces.map(p => (
                <option key={p} value={p}>{p === 'All' ? 'All Provinces' : p}</option>
              ))}
            </select>
          </div>

          {/* CLV Range */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase">CLV Range ($ CAD)</span>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={clvMinInput}
                onChange={(e) => { setClvMinInput(e.target.value); setCurrentPage(1); }}
                className={`w-full bg-bg border rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent ${
                  !isClvRangeValid ? 'border-danger' : 'border-border'
                }`}
              />
              <input
                type="number"
                placeholder="Max"
                value={clvMaxInput}
                onChange={(e) => { setClvMaxInput(e.target.value); setCurrentPage(1); }}
                className={`w-full bg-bg border rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent ${
                  !isClvRangeValid ? 'border-danger' : 'border-border'
                }`}
              />
            </div>
            {!isClvRangeValid && (
              <span className="text-[9px] text-danger font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Invalid bounds</span>
            )}
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="w-full bg-card hover:bg-card-hover border border-border hover:border-text-secondary font-semibold text-xs py-2 rounded-lg text-text-primary transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Scrollable Results Area (Right) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Histogram at Top */}
          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-2">
              <span>Risk Buckets Histogram Proximities</span>
              {(riskRangeMin !== 0 || riskRangeMax !== 1) && (
                <span className="text-[10px] text-accent lowercase">Filter active: {Math.round(riskRangeMin*100)}-{Math.round(riskRangeMax*100)}%</span>
              )}
            </h3>
            <ChartNarrator chartType="Churn Risk Density" chartData={filteredMembers}>
              <ChurnHistogram members={filteredMembers} onBucketClick={handleHistogramBucketClick} />
            </ChartNarrator>
          </div>

          {/* Records List Card */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/60">
              <div>
                <span className="text-xs text-text-secondary">
                  Showing <strong className="text-text-primary">{num(filteredMembers.length)}</strong> of {num(totalCount)} passengers
                </span>
              </div>
              
              {/* CSV Export */}
              <button
                onClick={handleExportCSV}
                disabled={filteredMembers.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-bg hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer border-none shadow-md disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export CSV ({num(filteredMembers.length)})
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-xs text-left border-collapse leading-normal">
                <thead>
                  <tr className="border-b border-border/60 text-text-secondary font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-2">
                      <button onClick={() => requestSort('loyaltyNumber')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                        Loyalty # <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-2">
                      <button onClick={() => requestSort('churnRisk')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                        Churn Risk % <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-2">
                      <button onClick={() => requestSort('segment')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                        Segment <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-2">
                      <button onClick={() => requestSort('clv')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                        CLV <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-2">
                      <button onClick={() => requestSort('forwardScore')} className="flex items-center gap-1 hover:text-accent font-semibold uppercase bg-transparent border-none cursor-pointer">
                        Forward CLV <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-2">Last Active</th>
                    <th className="py-2.5 px-2">Priority</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.length > 0 ? (
                    paginatedMembers.map((m) => {
                      const forwardScore = Math.round(m.clv * (1.15 - m.churnRisk * 0.9));
                      
                      // Priority determination
                      const isHigh = m.churnRisk >= 0.7 && !m.cancellationYear;
                      const isMed = m.churnRisk >= 0.3 && m.churnRisk < 0.7 && !m.cancellationYear;
                      
                      let priorityText = 'Low';
                      let priorityColor = 'text-success bg-success/10 border-success/20';
                      if (m.cancellationYear) {
                        priorityText = 'Churned';
                        priorityColor = 'text-text-secondary bg-bg border-border';
                      } else if (isHigh) {
                        priorityText = 'High';
                        priorityColor = 'text-danger bg-danger/10 border-danger/20';
                      } else if (isMed) {
                        priorityText = 'Medium';
                        priorityColor = 'text-warning bg-warning/10 border-warning/20';
                      }

                      // Row background tint by risk
                      let tintClass = '';
                      if (m.cancellationYear) tintClass = 'bg-card/20';
                      else if (isHigh) tintClass = 'bg-danger/5 hover:bg-danger/10';
                      else if (isMed) tintClass = 'bg-warning/5 hover:bg-warning/10';
                      else tintClass = 'bg-success/5 hover:bg-success/10';

                      return (
                        <tr 
                          key={m.loyaltyNumber} 
                          className={`border-b border-border/40 hover:bg-card-hover/20 transition-all ${tintClass}`}
                        >
                          <td className="py-3 px-2 font-mono font-bold text-accent">{m.loyaltyNumber}</td>
                          <td className="py-3 px-2 font-semibold">
                            {m.cancellationYear ? (
                              <span className="text-text-secondary">Opt-Out</span>
                            ) : (
                              <span className={m.churnRisk >= 0.7 ? 'text-danger' : m.churnRisk >= 0.3 ? 'text-warning' : 'text-success'}>
                                {pct(m.churnRisk)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 font-medium text-text-primary">{m.segment}</td>
                          <td className="py-3 px-2 font-bold text-text-primary">{currency(m.clv)}</td>
                          <td className="py-3 px-2 font-bold text-accent">{currency(forwardScore)}</td>
                          <td className="py-3 px-2 text-text-secondary">{getLastActiveText(m)}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityColor}`}>
                              {priorityText}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => handleOpenDetailModal(m)}
                              className="bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent text-accent px-2 py-1 rounded flex items-center gap-1 active:scale-95 transition-all text-[11px] cursor-pointer inline-flex ml-auto border-none"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-text-secondary bg-transparent">
                        No members match these search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-3 border-t border-border/40 text-xs">
                <span className="text-text-secondary">
                  Showing page <span className="font-semibold text-text-primary">{currentPage}</span> of{' '}
                  <span className="font-semibold text-text-primary">{totalPages}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-text-primary font-medium px-2">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded bg-card border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Member Detail Modal Overlay */}
      {selectedMemberDetail && (
        <MemberDetailModal
          member={selectedMemberDetail}
          onClose={() => setSelectedMemberDetail(null)}
        />
      )}
    </div>
  );
};

export default Churn;
