import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { ApiKeyContext } from '../context/ApiKeyContext';
import { useAI } from '../hooks/useAI';
import { useSegments, useMembers } from '../hooks/useData';
import { 
  Sparkles, 
  Key, 
  Send, 
  Brain, 
  RefreshCw, 
  Printer, 
  Copy, 
  Check, 
  Mail, 
  HelpCircle, 
  Award,
  AlertCircle
} from 'lucide-react';
import { currency, num, pct } from '../utils/formatters';

const AI = () => {
  const { apiKey, setApiKey, provider, setProvider } = useContext(ApiKeyContext);
  const { data: segments } = useSegments();
  const { data: members } = useMembers();
  const { generateStrategy, streamChat, generateEmail } = useAI();

  // Local key override input state
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  // SECTION 1: Segment Brief State
  const [strategySegment, setStrategySegment] = useState('At-Risk Flyers');
  const [briefRawText, setBriefRawText] = useState('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const briefRef = useRef(null);

  // SECTION 2: Custom Query State
  const [customQuery, setCustomQuery] = useState('');
  const [chatOutput, setChatOutput] = useState('');
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);

  // SECTION 3: Batch Emails State
  const [batchSegment, setBatchSegment] = useState('At-Risk Flyers');
  const [batchEmails, setBatchEmails] = useState({
    email0: { text: '', isGenerating: false, copied: false },
    email1: { text: '', isGenerating: false, copied: false },
    email2: { text: '', isGenerating: false, copied: false }
  });

  // Sync override input with context
  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  const handleSaveKey = () => {
    setApiKey(localKey);
    setShowKeyConfirm(true);
    setTimeout(() => setShowKeyConfirm(false), 2000);
  };

  // 1. Strategic Brief Generator
  const handleGenerateBrief = () => {
    if (isGeneratingBrief) return;

    setIsGeneratingBrief(true);
    setBriefRawText('');

    let accumulated = '';
    const onToken = (token) => {
      accumulated += token;
      setBriefRawText(accumulated);
    };

    const onDone = () => {
      setIsGeneratingBrief(false);
    };

    const onError = () => {
      setBriefRawText('Failed to compile strategic brief. Verify that the AI service is active.');
      setIsGeneratingBrief(false);
    };

    generateStrategy(strategySegment, onToken, onDone, onError);
  };

  // Parse structured sections dynamically for the 6 sub-cards
  const parsedBrief = useMemo(() => {
    const sections = {
      'Summary': '',
      'Signals': '',
      'Hidden Risk': '',
      '90-Day Plan': '',
      'Metrics': '',
      'Don\'t Do': ''
    };

    const regex = /###\s*(Summary|Signals|Hidden Risk|90-Day Plan|Metrics|Don't Do)([\s\S]*?)(?=###|$)/gi;
    let match;
    let found = false;

    while ((match = regex.exec(briefRawText)) !== null) {
      found = true;
      const key = match[1].trim();
      const normKey = Object.keys(sections).find(k => k.toLowerCase() === key.toLowerCase()) || key;
      sections[normKey] = match[2].trim();
    }

    if (!found) {
      sections['Summary'] = briefRawText;
    }

    return sections;
  }, [briefRawText]);

  const handlePrintBrief = () => {
    const printContent = briefRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple print utility using document context
    document.body.innerHTML = `
      <div style="background:#0d1117; color:#e6edf3; font-family:sans-serif; padding:40px;">
        <h1 style="color:#58a6ff; font-family:serif; border-bottom:1px solid #30363d; padding-bottom:10px;">
          LoyaltyIQ Strategic Brief: ${strategySegment}
        </h1>
        <div style="margin-top:20px;">${printContent}</div>
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Refresh layout to restore state
  };

  // 2. Custom Strategy Queries
  const queryChips = [
    "Which segment to prioritise?",
    "ROI of reactivating Dormant Members?",
    "Compare At-Risk vs Seasonal"
  ];

  const handleSelectChip = (chip) => {
    setCustomQuery(chip);
  };

  const handleSubmitQuery = () => {
    if (!customQuery.trim() || isGeneratingChat) return;

    setIsGeneratingChat(true);
    setChatOutput('');

    let accumulated = '';
    const onToken = (token) => {
      accumulated += token;
      setChatOutput(accumulated);
    };

    const onDone = () => {
      setIsGeneratingChat(false);
    };

    const onError = () => {
      setChatOutput('Error compiling strategy insights.');
      setIsGeneratingChat(false);
    };

    streamChat(customQuery, [], onToken, onDone, onError);
  };

  // 3. Batch Email Generator
  const sampleBatchMembers = useMemo(() => {
    if (!members) return [];
    return members
      .filter(m => m.segment === batchSegment && !m.cancellationYear)
      .slice(0, 3);
  }, [members, batchSegment]);

  const handleGenerateBatchEmails = () => {
    if (sampleBatchMembers.length === 0) return;

    // Reset email boxes
    setBatchEmails({
      email0: { text: '', isGenerating: true, copied: false },
      email1: { text: '', isGenerating: true, copied: false },
      email2: { text: '', isGenerating: true, copied: false }
    });

    sampleBatchMembers.forEach((m, idx) => {
      let accumulated = '';
      
      const onToken = (token) => {
        accumulated += token;
        setBatchEmails(prev => ({
          ...prev,
          [`email${idx}`]: { ...prev[`email${idx}`], text: accumulated }
        }));
      };

      const onDone = () => {
        setBatchEmails(prev => ({
          ...prev,
          [`email${idx}`]: { ...prev[`email${idx}`], isGenerating: false }
        }));
      };

      const onError = () => {
        setBatchEmails(prev => ({
          ...prev,
          [`email${idx}`]: { text: 'Failed to draft outreach.', isGenerating: false }
        }));
      };

      generateEmail(m, onToken, onDone, onError);
    });
  };

  const handleCopyEmail = (idx) => {
    const key = `email${idx}`;
    const text = batchEmails[key].text;
    if (text) {
      navigator.clipboard.writeText(text);
      setBatchEmails(prev => ({
        ...prev,
        [key]: { ...prev[key], copied: true }
      }));
      setTimeout(() => {
        setBatchEmails(prev => ({
          ...prev,
          [key]: { ...prev[key], copied: false }
        }));
      }, 2000);
    }
  };

  const filteredSegments = segments ? segments.filter(s => s.segment !== 'Dormant / Churned') : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent fill-current" /> ✦ AI Strategy Centre
        </h1>
        <p className="text-text-secondary text-sm">Advanced Strategic Planning and LLM Marketing Telemetry.</p>
      </div>

      {/* API Key Panel */}
      <div className="card p-5 space-y-4 select-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1">
              <Key className="h-4 w-4 text-accent" /> API Credentials Configuration
            </h3>
            <p className="text-[11px] text-text-secondary leading-normal">
              Using {apiKey ? 'custom override API key' : 'default backend key'}. Credentials are saved in localStorage.
            </p>
          </div>
          <span className="bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            {provider === 'gemini' ? 'Gemini 1.5 Flash active' : provider === 'openai' ? 'OpenAI GPT-4o active' : 'Claude 3.5 Sonnet active'}
          </span>
        </div>

        {!apiKey && (
          <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex items-center gap-2 text-xs text-warning">
            <AlertCircle className="h-4.5 w-4.5 text-warning shrink-0" />
            <span>Using sandbox backend credentials. Enter an override key below to run direct prompts.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-semibold cursor-pointer"
          >
            <option value="claude">Anthropic Claude (3.5 Sonnet)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="gemini">Google Gemini (1.5 Flash)</option>
          </select>
          <input
            type="password"
            placeholder={provider === 'gemini' ? "Enter Gemini API Key..." : provider === 'openai' ? "Enter OpenAI API Key..." : "Enter Claude API Key..."}
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
          />
          <button
            onClick={handleSaveKey}
            className="bg-accent text-bg hover:opacity-90 active:scale-95 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer border-none shadow-md"
          >
            {showKeyConfirm ? 'Saved!' : 'Save Key'}
          </button>
        </div>
      </div>

      {/* SECTION 1: Segment Strategic Brief */}
      <div className="card p-5 space-y-5 select-none">
        <div className="border-b border-border/40 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="h-4.5 w-4.5 text-accent animate-pulse" /> 1. Segment Strategic Brief Generator
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Stream structured briefs covering signals, risk parameters, and action plans.</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={strategySegment}
              onChange={(e) => setStrategySegment(e.target.value)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              {filteredSegments.map(s => (
                <option key={s.segment} value={s.segment}>{s.segment}</option>
              ))}
            </select>

            <button
              onClick={handleGenerateBrief}
              disabled={isGeneratingBrief}
              className="bg-accent text-bg hover:opacity-90 active:scale-95 disabled:opacity-60 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border-none flex items-center gap-1 cursor-pointer shrink-0"
            >
              {isGeneratingBrief ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 fill-current" />}
              {isGeneratingBrief ? 'Compiling...' : 'Generate Brief'}
            </button>
          </div>
        </div>

        {/* 6 Sub-Cards Grid */}
        {briefRawText && (
          <div className="space-y-4 count-up">
            <div ref={briefRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(parsedBrief).map(([title, content]) => (
                <div 
                  key={title} 
                  className={`p-4 bg-bg border-l-4 rounded-r-lg text-xs leading-relaxed space-y-2 border ${
                    title === 'Summary' ? 'border-l-accent' :
                    title === 'Signals' ? 'border-l-success' :
                    title === 'Hidden Risk' ? 'border-l-danger' :
                    title === '90-Day Plan' ? 'border-l-warning' :
                    title === 'Metrics' ? 'border-l-accent' : 'border-l-secondary'
                  }`}
                >
                  <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border/20 pb-1.5">
                    {title}
                  </h4>
                  <div className="text-text-secondary whitespace-pre-wrap font-sans">
                    {content || (isGeneratingBrief ? 'Analyzing database...' : 'No telemetry.')}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePrintBrief}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card hover:bg-card-hover border border-border text-text-primary cursor-pointer active:scale-95 transition-all"
              >
                <Printer className="h-4 w-4" /> Export Strategic Brief (PDF)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Custom Strategic Query */}
      <div className="card p-5 space-y-4 select-none">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Send className="h-4.5 w-4.5 text-accent" /> 2. Custom Strategy Query Terminal
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">Prompt the consultant regarding ROI predictions, prioritizations, or segment metrics.</p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          {queryChips.map(c => (
            <button
              key={c}
              onClick={() => handleSelectChip(c)}
              className="bg-bg hover:bg-card-hover/40 border border-border hover:border-accent text-text-secondary hover:text-accent px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer select-none"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="flex gap-2">
          <textarea
            placeholder="Type strategic query (e.g. Compare Elite vs At-Risk cohorts)..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            disabled={isGeneratingChat}
            className="flex-1 bg-bg border border-border rounded-lg p-3 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[80px]"
          />
          <button
            onClick={handleSubmitQuery}
            disabled={isGeneratingChat || !customQuery.trim()}
            className="bg-accent text-bg hover:opacity-90 active:scale-95 disabled:opacity-40 text-xs font-bold px-4 rounded-lg transition-all border-none flex items-center justify-center shrink-0 cursor-pointer shadow-md"
          >
            {isGeneratingChat ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {/* Custom Query Output Box */}
        {chatOutput && (
          <div className="p-4 bg-bg border-l-4 border-accent rounded-r-lg text-xs leading-relaxed text-text-primary whitespace-pre-wrap font-sans count-up">
            <span className={isGeneratingChat ? 'stream-cursor font-medium' : 'font-medium'}>{chatOutput}</span>
          </div>
        )}
      </div>

      {/* SECTION 3: Parallel Batch Email Generator */}
      <div className="card p-5 space-y-4 select-none">
        <div className="border-b border-border/40 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-accent" /> 3. Parallel CRM Batch Campaign Emailer
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">Generate 3 emails in parallel for sample segment accounts.</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={batchSegment}
              onChange={(e) => setBatchSegment(e.target.value)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              {filteredSegments.map(s => (
                <option key={s.segment} value={s.segment}>{s.segment}</option>
              ))}
            </select>

            <button
              onClick={handleGenerateBatchEmails}
              disabled={sampleBatchMembers.length === 0}
              className="bg-accent text-bg hover:opacity-90 active:scale-95 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border-none flex items-center gap-1 cursor-pointer shrink-0"
            >
              ✦ Generate All 3 Emails
            </button>
          </div>
        </div>

        {/* Side by Side Cards Render */}
        {sampleBatchMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {sampleBatchMembers.map((m, idx) => {
              const emailState = batchEmails[`email${idx}`];
              return (
                <div key={m.loyaltyNumber} className="bg-bg/40 border border-border p-4 rounded-lg text-xs space-y-3 count-up flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start border-b border-border/20 pb-1.5">
                      <div>
                        <span className="font-bold text-accent font-mono">Member #{m.loyaltyNumber}</span>
                        <p className="text-[10px] text-text-secondary mt-0.5">{m.city}, {m.province}</p>
                      </div>
                      
                      {emailState?.text && (
                        <button
                          onClick={() => handleCopyEmail(idx)}
                          className="text-text-secondary hover:text-accent font-semibold p-1 hover:bg-card rounded cursor-pointer border-none bg-transparent flex items-center gap-0.5 text-[10px]"
                        >
                          {emailState.copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          {emailState.copied ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-text-secondary space-y-0.5">
                      <p>Card: **{m.card}** · Flights: **{num(m.totalFlights)}**</p>
                      <p>CLV: **{currency(m.clv)}** · Risk: **{pct(m.churnRisk)}**</p>
                    </div>
                  </div>

                  {emailState?.text ? (
                    <div className="p-2.5 bg-bg border border-border rounded text-[11px] max-h-[180px] overflow-y-auto leading-relaxed text-text-primary whitespace-pre-wrap font-sans mt-2">
                      <span className={emailState.isGenerating ? 'stream-cursor' : ''}>
                        {emailState.text}
                      </span>
                    </div>
                  ) : (
                    <div className="h-[120px] bg-bg/20 rounded border border-border/40 flex items-center justify-center text-text-secondary text-[11px] mt-2 select-none border-dashed">
                      {emailState?.isGenerating ? (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" /> Streaming...
                        </div>
                      ) : (
                        'Awaiting Batch Trigger...'
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AI;
