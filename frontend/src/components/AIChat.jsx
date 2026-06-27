import React, { useState, useRef, useEffect, useContext } from 'react';
import { Sparkles, X, Send, Settings, RefreshCw, Trash2 } from 'lucide-react';
import { ApiKeyContext } from '../context/ApiKeyContext';
import { fetchStream } from '../utils/stream';

const AIChat = ({ activeMember }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your LoyaltyIQ Strategy Assistant. Type a question or request (e.g., 'How can we retain high risk members in Ontario?') and I'll generate an insights strategy."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const { apiKey, setApiKey, provider, setProvider } = useContext(ApiKeyContext);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const chatEndRef = useRef(null);
  const activeControllerRef = useRef(null);

  // Sync keyInput with context
  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Append user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setIsGenerating(true);

    // Prepare history format
    const history = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add placeholder AI message for streaming
    setMessages((prev) => [...prev, { sender: 'ai', text: '', isStreaming: true }]);

    let accumulatedResponse = '';
    const apiUrl = import.meta.env.VITE_API_URL || '';

    // Mock Stream helper if no key and endpoint
    if (!apiUrl && !apiKey) {
      const mockStream = (textToMock) => {
        const tokens = textToMock.split(/(\s+)/);
        let index = 0;
        const interval = setInterval(() => {
          if (index >= tokens.length) {
            clearInterval(interval);
            setIsGenerating(false);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.sender === 'ai') {
                last.isStreaming = false;
              }
              return next;
            });
            activeControllerRef.current = null;
            return;
          }
          accumulatedResponse += tokens[index];
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.sender === 'ai' && last.isStreaming) {
              last.text = accumulatedResponse;
            }
            return next;
          });
          index++;
        }, 30);

        activeControllerRef.current = {
          abort: () => {
            clearInterval(interval);
            setIsGenerating(false);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.sender === 'ai') {
                last.isStreaming = false;
              }
              return next;
            });
            activeControllerRef.current = null;
          }
        };
      };

      // Customized responses based on input keywords
      const query = text.toLowerCase();
      let responseText = `Hello! I'm your LoyaltyIQ Strategy Assistant. Based on our airline loyalty metrics:
      
- **Demographics**: Ontario holds the highest density (5,404 members), followed closely by British Columbia (4,409 members).
- **Churn Analysis**: The average churn risk is heavily tied to card tiers; Star card members exhibit the highest risk, while Aurora tier members are highly stable.
- **CLV Distribution**: The average CLV is CAD $7,988.90, but we have 376 extreme outliers with CLVs exceeding CAD $25,000 who require dedicated concierge care.

How else can I assist you with passenger behavioral insights today?`;

      if (query.includes('member') || query.includes('context')) {
        if (activeMember) {
          responseText = `### Strategic Profile Analysis: Member #${activeMember.loyaltyNumber}
- **Tier**: ${activeMember.card} Status
- **Risk Level**: ${pct(activeMember.churnRisk)} Probability
- **CLV Valuation**: ${currency(activeMember.clv)}
- **Campaign Recommendation**: Execute **${activeMember.segment}** outreach program. Surprise milestone flight vouchers and priority lounge access should be dispatched via email.`;
        } else {
          responseText = `Please select or search a passenger profile in the CRM Lookup page to inspect custom risk factors and points balance contexts.`;
        }
      } else if (query.includes('lounge') || query.includes('roi')) {
        responseText = `### Incentive Strategy ROI Projection
- **Incentive**: Complimentary Hub Lounge Pass ($50 unit cost).
- **Target Audience**: Moderate Risk (30-70% probability) Aurora and Nova card members.
- **Expected Outcome**: 8% churn risk reduction. Campaign yield shows 3.2x ROI by recovering high-CLV travelers before cancellations.`;
      } else if (query.includes('at-risk') || query.includes('priority')) {
        responseText = `### At-Risk Flyer Recovery Plan
- **Primary Segment**: Flyers with standard Star tier cards showing 90-day inactivity.
- **Trigger**: Falling point redemption ratios.
- **Incentive**: 15% fare discount + double point miles voucher. 
- **Outreach**: Direct email offer coupled with app push notifications.`;
      }

      mockStream(responseText);
      return;
    }

    // Call fetchStream for streaming from server
    const body = {
      apiKey,
      message: text,
      history,
      activeMemberId: activeMember?.loyaltyNumber || null,
      provider
    };

    const onToken = (token) => {
      setIsGenerating(false);
      accumulatedResponse += token;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.sender === 'ai' && last.isStreaming) {
          last.text = accumulatedResponse;
        }
        return next;
      });
    };

    const onDone = () => {
      setIsGenerating(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.sender === 'ai') {
          last.isStreaming = false;
        }
        return next;
      });
      activeControllerRef.current = null;
    };

    const onError = (err) => {
      console.error(err);
      setIsGenerating(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.sender === 'ai') {
          last.text = "Error: Failed to fetch AI response. Please verify your custom API key settings.";
          last.isStreaming = false;
        }
        return next;
      });
      activeControllerRef.current = null;
    };

    const controller = fetchStream(`${apiUrl}/chat`, body, onToken, onDone, onError);
    activeControllerRef.current = controller;
  };

  const handleCancel = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
  };

  const saveApiKey = () => {
    setApiKey(keyInput);
    setShowKeySettings(false);
  };

  const clearHistory = () => {
    setMessages([
      {
        sender: 'ai',
        text: "Strategy assistant history cleared. How can I help you today?"
      }
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Analyze At-Risk segment",
    "Loyalty program suggestions",
    "ROI of lounge passes",
    "Explain active member context"
  ];

  // Helper formatters
  const currency = (val) => val.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  const pct = (val) => `${(val * 100).toFixed(1)}%`;

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Collapsed state pill button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent hover:scale-105 active:scale-95 text-bg border border-border/20 shadow-lg cursor-pointer transition-all duration-200 font-semibold text-xs select-none ai-glow"
        >
          <Sparkles className="h-4.5 w-4.5 text-bg fill-current" />
          <span>✦ Ask AI</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
        </button>
      )}

      {/* Expanded chat window panel (390px x 540px) */}
      {isOpen && (
        <div className="w-[390px] h-[540px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden ai-glow count-up">
          {/* Header */}
          <div className="px-4 py-3.5 bg-card-hover border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent fill-current" />
              <span className="font-bold text-sm text-text-primary">✦ LoyaltyIQ AI</span>
              <span className="bg-accent/10 border border-accent/25 text-accent rounded text-[9px] px-1.5 py-0.5 font-bold uppercase">
                {provider === 'gemini' ? 'gemini-1-5-flash' : provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-3-5'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKeySettings(!showKeySettings)}
                className={`p-1.5 rounded-md hover:bg-card text-text-secondary hover:text-accent transition-colors cursor-pointer border-none bg-transparent`}
                title="API Key Configuration"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-md hover:bg-card text-text-secondary hover:text-danger transition-colors cursor-pointer border-none bg-transparent"
                title="Clear Chat History"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-card text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-none bg-transparent"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* API Key settings panel */}
          {showKeySettings && (
            <div className="px-4 py-3 bg-card-hover border-b border-border text-xs flex flex-col gap-2 count-up">
              <div className="font-semibold text-text-primary">Configure Custom API Credentials</div>
              <p className="text-[11px] text-text-secondary">Credentials are persisted in localStorage.</p>
              <div className="flex flex-col gap-2">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="bg-bg border border-border rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-accent text-xs font-semibold cursor-pointer"
                >
                  <option value="claude">Anthropic Claude (3.5 Sonnet)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google Gemini (1.5 Flash)</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder={provider === 'gemini' ? "Enter Gemini API key..." : provider === 'openai' ? "Enter OpenAI API key..." : "Enter Claude API key..."}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="flex-1 bg-bg border border-border rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-accent text-xs font-mono"
                  />
                  <button
                    onClick={saveApiKey}
                    className="bg-accent text-bg px-3 py-1.5 rounded font-semibold hover:bg-opacity-90 active:scale-95 transition-all text-xs border-none cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
              {apiKey && (
                <span className="text-[10px] text-success font-semibold flex items-center gap-1">✓ Custom key active</span>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} count-up`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-accent text-bg font-medium rounded-br-none'
                      : 'bg-card border border-border text-text-primary rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <div className={`space-y-1 ${msg.isStreaming ? 'stream-cursor' : ''}`}>
                       {msg.text.split('\n').map((line, lineIdx) => {
                        const isBullet = line.trim().startsWith('- ');
                        const cleanLine = isBullet ? line.trim().substring(2) : line;

                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const boldParts = [];
                        let lastIdx = 0;
                        let match;
                        while ((match = boldRegex.exec(cleanLine)) !== null) {
                          if (match.index > lastIdx) {
                            boldParts.push(cleanLine.substring(lastIdx, match.index));
                          }
                          boldParts.push(<strong key={match.index} className="font-semibold text-accent">{match[1]}</strong>);
                          lastIdx = boldRegex.lastIndex;
                        }
                        if (lastIdx < cleanLine.length) {
                          boldParts.push(cleanLine.substring(lastIdx));
                        }

                        const content = boldParts.length > 0 ? boldParts : cleanLine;

                        if (isBullet) {
                          return (
                            <div key={lineIdx} className="pl-3 relative mt-0.5">
                              <span className="absolute left-0 text-accent">•</span>
                              {content}
                            </div>
                          );
                        }
                        return <div key={lineIdx} className="min-h-[14px]">{content}</div>;
                      })}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
                <span className="text-[9px] text-text-secondary mt-1 px-1 font-medium">
                  {msg.sender === 'user' ? 'You' : 'Strategy Assistant'}
                </span>
              </div>
            ))}
            
            {/* Suggested Prompts when empty */}
            {messages.length === 1 && !isGenerating && (
              <div className="grid grid-cols-2 gap-2 pt-2 count-up">
                {suggestedPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="p-2.5 bg-card hover:bg-card-hover border border-border hover:border-accent text-text-secondary hover:text-accent rounded-xl text-[10px] text-left leading-normal font-semibold transition-all active:scale-97 cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Active member context pill */}
          {activeMember && (
            <div className="px-3 py-1 bg-accent/15 border border-accent/25 text-accent rounded-full text-[10px] font-bold w-fit mx-auto mb-2 select-none count-up">
              Context: Member #{activeMember.loyaltyNumber}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 border-t border-border bg-card flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isGenerating ? "AI is generating strategy..." : "Ask the AI Strategy Assistant..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isGenerating}
                className="flex-1 bg-bg border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-accent text-xs placeholder:text-text-secondary font-medium"
              />
              {isGenerating ? (
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-xl bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                  title="Cancel generation"
                >
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className="p-2.5 rounded-xl bg-accent text-bg disabled:bg-card-hover disabled:text-text-secondary disabled:border-border border border-accent hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Footnote */}
            <span className="text-[9px] text-text-secondary text-center select-none pt-1">
              Powered by {provider === 'gemini' ? 'Gemini · Google' : provider === 'openai' ? 'GPT-4o · OpenAI' : 'Claude · Anthropic'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
