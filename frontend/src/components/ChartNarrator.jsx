import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import { Sparkles, EyeOff, RefreshCw, HelpCircle, Brain, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

/**
 * AI Chart Narrator wrapper.
 * Wraps any chart component, adding a "✦ What does this mean?" button below.
 * Streams explanations token-by-token.
 */
const ChartNarrator = ({ children, chartType = 'Loyalty Metrics', chartData = [] }) => {
  const { narrateChart } = useAI();
  const [state, setState] = useState({
    loading: false,
    narration: '',
    visible: false
  });
  const [thoughtsExpanded, setThoughtsExpanded] = useState(true);
  
  const activeControllerRef = useRef(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  const handleToggle = () => {
    if (state.visible) {
      setState(prev => ({ ...prev, visible: false }));
      return;
    }

    // Set visibility active and trigger loading state
    setState({
      loading: true,
      narration: '',
      visible: true
    });
    setThoughtsExpanded(true);

    let accumulated = '';

    const onToken = (token) => {
      accumulated += token;
      setState(prev => ({
        ...prev,
        loading: false, // Turn off loader on first chunk
        narration: accumulated
      }));
    };

    const onDone = () => {
      setState(prev => ({ ...prev, loading: false }));
      activeControllerRef.current = null;
    };

    const onError = (err) => {
      console.error(err);
      setState({
        loading: false,
        visible: true,
        narration: 'Could not complete AI chart narration. Verify API settings.'
      });
      activeControllerRef.current = null;
    };

    const controller = narrateChart(chartType, chartData, onToken, onDone, onError);
    activeControllerRef.current = controller;
  };

  const parseNarration = (text) => {
    let thinking = '';
    let analysis = '';
    let isThinking = false;
    let hasThoughtBlock = false;

    if (text.includes('<think>')) {
      hasThoughtBlock = true;
      const thinkStart = text.indexOf('<think>') + 7;
      const thinkEnd = text.indexOf('</think>');
      
      if (thinkEnd !== -1) {
        thinking = text.substring(thinkStart, thinkEnd);
        analysis = text.substring(thinkEnd + 8);
        isThinking = false;
      } else {
        thinking = text.substring(thinkStart);
        isThinking = true;
      }
    } else {
      if (text.startsWith('<') && !text.startsWith('<think>') && '<think>'.startsWith(text)) {
        isThinking = true;
        hasThoughtBlock = true;
      } else {
        analysis = text;
      }
    }

    // Clean any stray tags
    thinking = thinking.replace(/<\/?think>?/g, '').trim();
    analysis = analysis.replace(/<\/?think>?/g, '').trim();

    return { thinking, analysis, isThinking, hasThoughtBlock };
  };

  const { thinking, analysis, isThinking, hasThoughtBlock } = parseNarration(state.narration);

  return (
    <div className="space-y-4 w-full h-full flex flex-col justify-between select-none">
      {/* Chart component */}
      <div className="flex-1 min-h-0">{children}</div>

      {/* Control bar */}
      <div className="pt-2 border-t border-border/40 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] text-text-secondary flex items-center gap-1 font-medium">
            <HelpCircle className="h-3.5 w-3.5" /> Strategy narration model v2.0
          </span>
          <button
            onClick={handleToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all select-none cursor-pointer border ${
              state.visible 
                ? 'bg-card border-border text-text-primary hover:bg-card-hover' 
                : 'bg-accent/15 border-accent/25 text-accent hover:bg-accent/20'
            }`}
          >
            {state.visible ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide Analysis
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 fill-current animate-pulse" /> ✦ What does this mean?
              </>
            )}
          </button>
        </div>

        {/* Narrative Box */}
        {state.visible && (
          <div className="p-4 bg-bg border-l-4 border-accent rounded-r-lg text-xs leading-relaxed text-text-primary transition-all duration-300 count-up flex flex-col gap-3">
            {state.loading ? (
              <div className="flex items-center gap-3 py-1">
                <RefreshCw className="h-4 w-4 animate-spin text-accent" />
                <span className="text-text-secondary">Consulting ML indicators...</span>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {/* 1. Thought Process Accordion */}
                {hasThoughtBlock && (
                  <div className="border border-border/40 rounded-lg bg-card/40 overflow-hidden w-full">
                    {/* Accordion Header */}
                    <div 
                      onClick={() => setThoughtsExpanded(!thoughtsExpanded)}
                      className="flex items-center justify-between px-3 py-2 bg-card-hover/20 hover:bg-card-hover/40 cursor-pointer select-none transition-colors border-b border-border/20"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5 text-accent animate-pulse" />
                        <span className="font-semibold text-text-secondary text-[10px] tracking-wide uppercase">AI Thought Process</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isThinking ? (
                          <span className="text-[10px] text-accent flex items-center gap-1.5 font-medium">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                            </span>
                            Reasoning...
                          </span>
                        ) : (
                          <span className="text-[10px] text-success flex items-center gap-1 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Thought complete
                          </span>
                        )}
                        {thoughtsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-text-secondary" /> : <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />}
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {thoughtsExpanded && (
                      <div className="p-3 bg-bg/40 text-[11px] font-mono text-text-secondary space-y-1.5 max-h-[160px] overflow-y-auto leading-relaxed select-text">
                        {thinking.split('\n').map((line, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-accent/40 select-none">&gt;</span>
                            <span>{line.replace(/^-\s*/, '')}</span>
                          </div>
                        ))}
                        {isThinking && (
                          <div className="flex items-center gap-1 text-accent select-none">
                            <span className="animate-pulse">&gt; analyzing metrics...</span>
                            <span className="inline-block text-accent font-bold stream-cursor" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Analysis Section */}
                <div className="flex gap-3 w-full">
                  <Sparkles className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    {isThinking && !analysis ? (
                      <div className="space-y-2 py-1">
                        <div className="text-text-secondary text-[11px] flex items-center gap-2">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                          </span>
                          Drafting strategy narration...
                        </div>
                        <div className="h-1 bg-border/40 rounded-full overflow-hidden w-2/3">
                          <div className="h-full bg-accent animate-pulse rounded-full w-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 whitespace-pre-wrap font-sans text-xs">
                        {analysis.split('\n').map((line, idx) => {
                          const isBullet = line.startsWith('- ') || line.startsWith('* ');
                          const cleanLine = isBullet ? line.substring(2) : line;

                          const boldRegex = /\*\*(.*?)\*\*/g;
                          const parts = [];
                          let last = 0;
                          let m;
                          while ((m = boldRegex.exec(cleanLine)) !== null) {
                            if (m.index > last) parts.push(cleanLine.substring(last, m.index));
                            parts.push(<strong key={m.index} className="font-semibold text-accent">{m[1]}</strong>);
                            last = boldRegex.lastIndex;
                          }
                          if (last < cleanLine.length) parts.push(cleanLine.substring(last));
                          const content = parts.length > 0 ? parts : cleanLine;

                          if (isBullet) {
                            return (
                              <div key={idx} className="pl-3.5 relative">
                                <span className="absolute left-0 text-accent">•</span>
                                {content}
                              </div>
                            );
                          }
                          return <div key={idx} className="min-h-[14px]">{content}</div>;
                        })}
                        {state.loading && (
                          <span className="inline-block text-accent font-bold stream-cursor animate-pulse">|</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartNarrator;
