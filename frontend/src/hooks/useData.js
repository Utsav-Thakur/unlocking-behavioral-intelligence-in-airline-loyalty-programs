import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// API Fetchers
const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url} (status: ${res.status})`);
  }
  return res.json();
};

export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => fetchJson('./data/final_summary.json'),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

export const useSegments = () => {
  return useQuery({
    queryKey: ['segments'],
    queryFn: () => fetchJson('./data/segment_summary.json'),
    staleTime: 1000 * 60 * 10,
  });
};

export const useAnomalies = () => {
  return useQuery({
    queryKey: ['anomalies'],
    queryFn: () => fetchJson('./data/anomaly_report.json'),
    staleTime: 1000 * 60 * 10,
  });
};

export const useFeatureImportance = () => {
  return useQuery({
    queryKey: ['features'],
    queryFn: () => fetchJson('./data/feature_importance.json'),
    staleTime: 1000 * 60 * 10,
  });
};

export const useStats = () => {
  const { data: members, isLoading, isError, error } = useMembers();

  const derived = useMemo(() => {
    if (!members) return null;

    const total = members.length;
    
    // High churn risk: active members (no cancellationYear) with churnRisk > 0.7
    const activeMembers = members.filter(m => !m.cancellationYear);
    const high_risk = activeMembers.filter(m => m.churnRisk > 0.7).length;
    
    // Average CLV
    const totalClv = members.reduce((sum, m) => sum + m.clv, 0);
    const avg_clv = total > 0 ? totalClv / total : 0;

    // Segment Breakdown
    const seg_breakdown = {};
    members.forEach(m => {
      seg_breakdown[m.segment] = (seg_breakdown[m.segment] || 0) + 1;
    });

    // Province Breakdown (Top 8)
    const provCounts = {};
    members.forEach(m => {
      provCounts[m.province] = (provCounts[m.province] || 0) + 1;
    });
    const prov_breakdown = Object.entries(provCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // CLV Status: High (CLV >= 10,000), Medium (CLV >= 5,000 and < 10,000), Low (CLV < 5,000)
    const clv_status = { High: 0, Medium: 0, Low: 0 };
    members.forEach(m => {
      if (m.clv >= 10000) clv_status.High++;
      else if (m.clv >= 5000) clv_status.Medium++;
      else clv_status.Low++;
    });

    // Churn Risk Distribution (10 Buckets: 0-10%, 10-20%, etc.)
    const churn_dist = Array.from({ length: 10 }, (_, i) => ({
      bucket: `${i * 10}-${(i + 1) * 10}%`,
      count: 0
    }));
    members.forEach(m => {
      const risk = m.churnRisk;
      let idx = Math.floor(risk * 10);
      if (idx > 9) idx = 9;
      if (idx < 0) idx = 0;
      churn_dist[idx].count++;
    });

    // Card Tier Distribution
    const card_tier_dist = { Star: 0, Nova: 0, Aurora: 0 };
    members.forEach(m => {
      if (card_tier_dist[m.card] !== undefined) {
        card_tier_dist[m.card]++;
      }
    });

    // Model Performance
    const model_perf = {
      auc: 0.941,
      f1: 0.799,
      prec: 0.982,
      rec: 0.674
    };

    return {
      total,
      high_risk,
      avg_clv,
      seg_breakdown,
      prov_breakdown,
      clv_status,
      churn_dist,
      card_tier_dist,
      model_perf
    };
  }, [members]);

  return {
    data: derived,
    isLoading,
    isError,
    error
  };
};
