import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plane, Sparkles, Users, Award, ShieldAlert, ChevronRight, Activity, Cpu } from 'lucide-react';
import KPICard from '../components/KPICard';

const Landing = () => {
  // Simple, elegant Typing Animation Loop
  const phrases = [
    "Unlocking Behavioral Intelligence in Airline Loyalty Programs",
    "16,737 Canadian Members · 2012–2018 Data Analytics",
    "ROC-AUC 0.941 · F1 Score 0.799 Predictive Accuracy",
    "Powered by XGBoost + Multi-LLM (Claude, Gemini, GPT-4o) Strategic Insights"
  ];
  
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(60);

  useEffect(() => {
    let timer;
    const currentPhrase = phrases[currentPhraseIdx];
    
    if (isDeleting) {
      // Deleting
      timer = setTimeout(() => {
        setTypedText(prev => prev.slice(0, -1));
        setTypingSpeed(30); // Faster delete
      }, typingSpeed);
    } else {
      // Typing
      timer = setTimeout(() => {
        setTypedText(currentPhrase.slice(0, typedText.length + 1));
        setTypingSpeed(60); // Normal type speed
      }, typingSpeed);
    }

    // Handle states
    if (!isDeleting && typedText === currentPhrase) {
      // Pause at full word
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setCurrentPhraseIdx(prev => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, currentPhraseIdx]);

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col justify-between select-none">
      
      {/* Navbar overlay */}
      <header className="w-full px-6 py-4 flex justify-between items-center border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-accent transform -rotate-45" />
          <span className="text-lg font-bold tracking-tight text-text-primary font-display">
            Loyalty<span className="text-accent">IQ</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[10px] uppercase font-bold text-success border border-success/30 px-2 py-0.5 rounded bg-success/5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" /> System Live
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center space-y-8 select-none">
        <div className="space-y-4">
          <span className="text-[11px] font-bold text-accent uppercase tracking-widest px-3 py-1 bg-accent/10 rounded-full border border-accent/25">
            Airline Loyalty Intelligence & Churn Predictor
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight font-display tracking-tight max-w-4xl min-h-[140px] md:min-h-[110px] lg:min-h-[90px] mb-4">
            {typedText}
            <span className="inline-block w-1 h-8 bg-accent ml-1 animate-pulse" />
          </h1>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Welcome to LoyaltyIQ! We help you diagnose member churn risk, segment flyers behaviorally, and compile AI-prescribed campaign strategies to save revenue before cancellations occur.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-accent text-bg hover:opacity-95 active:scale-95 text-sm font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-accent/15 cursor-pointer border-none"
          >
            Enter Dashboard <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <Link
            to="/lookup"
            className="flex items-center gap-2 bg-card hover:bg-card-hover border border-border text-text-primary active:scale-95 text-sm font-semibold px-6 py-3 rounded-lg transition-all cursor-pointer"
          >
            CRM Lookup
          </Link>
        </div>

        {/* Animated KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-8 text-left">
          <KPICard
            title="Total Members"
            value={16737}
            sub="Active Database"
            icon={Users}
            color="accent"
            formatter={(val) => Math.round(val).toLocaleString()}
          />
          <KPICard
            title="Avg Churn Rate"
            value={23.6}
            sub="Predicted Churners"
            icon={ShieldAlert}
            color="danger"
            formatter={(val) => val.toFixed(1) + '%'}
          />
          <KPICard
            title="Average CLV"
            value={7947}
            sub="Passenger Invoice Value"
            icon={Award}
            color="success"
            formatter={(val) => '$' + Math.round(val).toLocaleString()}
          />
          <KPICard
            title="Dormant Members"
            value={1170}
            sub="Inactive > 90 Days"
            icon={Activity}
            color="warning"
            formatter={(val) => Math.round(val).toLocaleString()}
          />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-card/40 border-y border-border/40 py-12 select-none">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div>
            <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">Machine Learning Operations Workflow</h2>
            <p className="text-text-secondary text-xs mt-1">Standard 3-step predictive intelligence data pipeline.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative">
            {/* Step 1 */}
            <div className="flex-1 card p-5 flex flex-col items-center gap-3 relative z-10">
              <div className="h-10 w-10 bg-accent/15 border border-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm font-display">
                01
              </div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Aggregated CRM Loading</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Aggregates flight records, points accumulation schedules, and regional hubs into standardized databases.
              </p>
            </div>

            {/* Connecting SVG Arrow 1 */}
            <div className="hidden md:block absolute left-[30%] top-1/2 transform -translate-y-1/2 z-0 w-[8%] text-text-secondary select-none opacity-40">
              <svg className="w-full" viewBox="0 0 50 12" fill="none">
                <path d="M0 6h45m0 0L40 1m5 5L40 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="flex-1 card p-5 flex flex-col items-center gap-3 relative z-10">
              <div className="h-10 w-10 bg-danger/15 border border-danger/20 rounded-full flex items-center justify-center text-danger font-bold text-sm font-display">
                02
              </div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">XGBoost Scoring</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Applies the classification model (AUC: 0.941) to calculate real-time churn probability metrics.
              </p>
            </div>

            {/* Connecting SVG Arrow 2 */}
            <div className="hidden md:block absolute left-[64%] top-1/2 transform -translate-y-1/2 z-0 w-[8%] text-text-secondary select-none opacity-40">
              <svg className="w-full" viewBox="0 0 50 12" fill="none">
                <path d="M0 6h45m0 0L40 1m5 5L40 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="flex-1 card p-5 flex flex-col items-center gap-3 relative z-10">
              <div className="h-10 w-10 bg-success/15 border border-success/20 rounded-full flex items-center justify-center text-success font-bold text-sm font-display">
                03
              </div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Prescriptive Strategy</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Connects streaming AI strategy brief compilers to output personalized marketing incentive plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="max-w-5xl mx-auto px-6 py-12 select-none space-y-6">
        <h2 className="text-lg font-bold font-display text-text-primary text-center tracking-tight">Active Analytics Overview Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-4 bg-card/60 border-l-4 border-danger rounded-r-lg text-xs leading-relaxed space-y-2">
            <span className="font-bold text-text-primary block flex items-center gap-1.5 uppercase text-[10px] text-danger">
              <ShieldAlert className="h-3.5 w-3.5" /> High Risk Cohorts
            </span>
            <p className="text-text-secondary">
              At-Risk members hold an average churn risk of **62.9%** and represent a combined **$6.4 million** in value exposure. Immediate intervention is advised.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 bg-card/60 border-l-4 border-warning rounded-r-lg text-xs leading-relaxed space-y-2">
            <span className="font-bold text-text-primary block flex items-center gap-1.5 uppercase text-[10px] text-warning">
              <Activity className="h-3.5 w-3.5" /> Flight Inactivity
            </span>
            <p className="text-text-secondary">
              Recent travel bookings drop significantly in winter seasons. Active brush zooming reveals seasonal valleys in January and February.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 bg-card/60 border-l-4 border-success rounded-r-lg text-xs leading-relaxed space-y-2">
            <span className="font-bold text-text-primary block flex items-center gap-1.5 uppercase text-[10px] text-success">
              <Cpu className="h-3.5 w-3.5" /> Model Telemetry
            </span>
            <p className="text-text-secondary">
              The model classifier boasts an F1 score of **0.799** and **98.2%** precision, minimizing false-alarm retention spending.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-border/40 text-center text-[10px] text-text-secondary bg-card/10 select-none">
        <p>© 2026 LoyaltyIQ Airline Analytics Dashboard · Google DeepMind Advanced Coding Suite</p>
      </footer>
    </div>
  );
};

export default Landing;
