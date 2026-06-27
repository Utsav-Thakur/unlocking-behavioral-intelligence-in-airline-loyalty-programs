import React from 'react';
import { 
  FileText, 
  Settings, 
  Layers, 
  Github, 
  Linkedin, 
  ExternalLink,
  Award,
  Database,
  UserCheck
} from 'lucide-react';

const About = () => {
  const features = [
    { name: 'Loyalty Number', desc: 'Unique 6-digit passenger account identifier.' },
    { name: 'Loyalty Card Tier', desc: 'Loyalty program classification (Star, Nova, Aurora).' },
    { name: 'Province', desc: 'Canadian province of residence.' },
    { name: 'City', desc: 'City of residence.' },
    { name: 'Postal Code', desc: 'Postal code prefix.' },
    { name: 'Gender', desc: 'Passenger gender profile.' },
    { name: 'Education', desc: 'Highest educational level attained.' },
    { name: 'Marital Status', desc: 'Marital status (Single, Married, Divorced).' },
    { name: 'Annual Salary', desc: 'Estimated passenger annual income.' },
    { name: 'Enrollment Year', desc: 'Registration year in the loyalty program.' },
    { name: 'Enrollment Month', desc: 'Registration month.' },
    { name: 'Enrollment Type', desc: 'Standard or promotional enrollment path.' },
    { name: 'Total Flights', desc: 'Cumulative flights booked during program lifecycle.' },
    { name: 'Distance Traveled', desc: 'Total travel distance logged in kilometers.' },
    { name: 'Points Accumulated', desc: 'Total points earned.' },
    { name: 'Points Redeemed', desc: 'Points redeemed for companion bookings or vouchers.' }
  ];

  const techBadges = [
    'Python', 'XGBoost', 'KMeans', 'React 18', 'Recharts', 'Tailwind CSS', 'FastAPI', 'Anthropic API', 'OpenAI API', 'Gemini API', 'Vercel'
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">System & Model Specs</h1>
        <p className="text-text-secondary text-sm">Technical documentation, model parameters, and team references.</p>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
        
        {/* Left 2 columns: Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary */}
          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Database className="h-4.5 w-4.5 text-accent" /> LoyaltyIQ Project Summary
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              **LoyaltyIQ** is a predictive analytics system designed to track customer loyalty health and predict churn for major Canadian aviation carriers. By merging historical CRM passenger details with flight timelines, the system maps disengagement indicators and compiles automated promotional email campaigns using Claude, OpenAI, and Gemini LLM strategy agents.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
              <div className="bg-bg/40 p-2.5 rounded border border-border/50">
                <span className="text-[10px] text-text-secondary block">Passenger Registry</span>
                <span className="font-bold text-text-primary mt-0.5 block">16,737 members</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded border border-border/50">
                <span className="text-[10px] text-text-secondary block">Total Flight Logs</span>
                <span className="font-bold text-text-primary mt-0.5 block">392,936 rows</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded border border-border/50">
                <span className="text-[10px] text-text-secondary block">Lifespan Window</span>
                <span className="font-bold text-text-primary mt-0.5 block">2012–2018</span>
              </div>
              <div className="bg-bg/40 p-2.5 rounded border border-border/50">
                <span className="text-[10px] text-text-secondary block">ROC-AUC Score</span>
                <span className="font-bold text-success mt-0.5 block">0.941 AUC</span>
              </div>
            </div>
          </div>

          {/* 16 Features grid */}
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <FileText className="h-4.5 w-4.5 text-accent" /> Classifier Predictor Features (16 Parameters)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {features.map(f => (
                <div key={f.name} className="p-2.5 bg-bg/40 border border-border/50 rounded-lg space-y-1">
                  <strong className="text-accent font-semibold">{f.name}</strong>
                  <p className="text-[11px] text-text-secondary leading-normal">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 column: Model Card & Built By */}
        <div className="space-y-6 lg:col-span-1">
          {/* Model Card */}
          <div className="card p-5 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Settings className="h-4.5 w-4.5 text-accent" /> XGBoost Model Card
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Hyperparameters</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5 font-mono text-[11px]">
                  <div className="bg-bg/40 px-2 py-1 rounded border border-border/40">max_depth: 6</div>
                  <div className="bg-bg/40 px-2 py-1 rounded border border-border/40">eta: 0.05</div>
                  <div className="bg-bg/40 px-2 py-1 rounded border border-border/40">trees: 350</div>
                  <div className="bg-bg/40 px-2 py-1 rounded border border-border/40">subsample: 0.8</div>
                  <div className="bg-bg/40 px-2 py-1 rounded border border-border/40">colsample: 0.8</div>
                  <div className="bg-bg/40 px-2 py-1 rounded border border-border/40">scale_pos: 3.24</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Validation Results</span>
                <div className="bg-bg/30 p-2.5 rounded border border-border/50 space-y-1.5 mt-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Mean ROC-AUC:</span>
                    <span className="font-bold text-success">0.941 ±0.003</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Mean F1 Score:</span>
                    <span className="font-bold text-text-primary">0.799</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Badges */}
          <div className="card p-5 space-y-3 text-xs">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Layers className="h-4.5 w-4.5 text-accent" /> Tech Badges Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {techBadges.map(badge => (
                <span 
                  key={badge} 
                  className="bg-bg border border-border px-2.5 py-1 rounded text-[11px] font-semibold text-text-secondary"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Built By Card */}
          <div className="card p-5 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <UserCheck className="h-4.5 w-4.5 text-accent animate-pulse" /> Engineering Registry
            </h3>

            <div className="space-y-3">
              <div>
                <strong className="text-text-primary font-bold text-sm block font-display">Utsav Kumar Thakur</strong>
                <span className="text-[10px] text-text-secondary block">Principal ML Specialist & MLOps Architect</span>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                <a 
                  href="https://github.com/Utsav-Thakur/unlocking-behavioral-intelligence-in-airline-loyalty-programs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent font-semibold transition-colors"
                >
                  <Github className="h-4 w-4" /> Project Repository <ExternalLink className="h-3 w-3 opacity-65" />
                </a>
                <a 
                  href="https://github.com/Utsav-Thakur" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent font-semibold transition-colors"
                >
                  <Github className="h-4 w-4" /> Utsav's GitHub Profile <ExternalLink className="h-3 w-3 opacity-65" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/utsav-thakur-2b01871b7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent font-semibold transition-colors"
                >
                  <Linkedin className="h-4 w-4" /> linkedin.com/in/utsav-thakur <ExternalLink className="h-3 w-3 opacity-65" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
