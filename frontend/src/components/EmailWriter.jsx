import React, { useState, useEffect, useContext, useRef } from 'react';
import { ApiKeyContext } from '../context/ApiKeyContext';
import { fetchStream } from '../utils/stream';
import { Sparkles, Clipboard, RefreshCw, Mail, Check } from 'lucide-react';

const EmailWriter = ({ member }) => {
  const { apiKey, provider } = useContext(ApiKeyContext);
  const [selectedTone, setSelectedTone] = useState('Friendly'); // 'Friendly' | 'Professional' | 'Urgent'
  const [emailDraft, setEmailDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeControllerRef = useRef(null);

  // Reset when member changes
  useEffect(() => {
    setEmailDraft('');
    setCopied(false);
    setIsDrafting(false);
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
  }, [member]);

  // Clean up controller on unmount
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  const handleDraftEmail = () => {
    if (!member || isDrafting) return;

    setIsDrafting(true);
    setEmailDraft('');
    setCopied(false);

    let accumulatedText = '';
    const apiUrl = import.meta.env.VITE_API_URL || '';

    // Mock Stream helper if no key and endpoint
    if (!apiUrl && !apiKey) {
      const mockMsg = getMockDraft(member, selectedTone);
      const tokens = mockMsg.split(/(\s+)/);
      let index = 0;
      
      const interval = setInterval(() => {
        if (index >= tokens.length) {
          clearInterval(interval);
          setIsDrafting(false);
          activeControllerRef.current = null;
          return;
        }
        accumulatedText += tokens[index];
        setEmailDraft(accumulatedText);
        index++;
      }, 25);

      activeControllerRef.current = {
        abort: () => {
          clearInterval(interval);
          setIsDrafting(false);
          activeControllerRef.current = null;
        }
      };
      return;
    }

    // Call fetchStream for streaming from server endpoint
    const body = {
      apiKey,
      member,
      tone: selectedTone,
      provider
    };

    const onToken = (token) => {
      accumulatedText += token;
      setEmailDraft(accumulatedText);
    };

    const onDone = () => {
      setIsDrafting(false);
      activeControllerRef.current = null;
    };

    const onError = (err) => {
      console.error(err);
      setEmailDraft('Failed to generate retention draft. Verify that the AI service is active.');
      setIsDrafting(false);
      activeControllerRef.current = null;
    };

    const controller = fetchStream(`${apiUrl}/api/ai/email`, body, onToken, onDone, onError);
    activeControllerRef.current = controller;
  };

  const handleCopyEmail = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper mock content generator
  const getMockDraft = (m, tone) => {
    let subject = '';
    let intro = '';
    let bodyText = '';
    let CTA = '';

    if (tone === 'Friendly') {
      subject = `Hey, passenger! Checking in on your loyalty flights ✈️`;
      intro = `Hope you are doing great! We noticed you've flown ${m.totalFlights} times with us, achieving a CLV of ${m.clv.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}. That is amazing!`;
      bodyText = `To show our appreciation for your loyalty, we want to help you maximize your benefits. We've set aside a special Points Redemption discount on all domestic routes booked in the next 30 days! Also, get ready for upgrade vouchers.`;
      CTA = `Let's get your next trip planned soon! Reply here or click inside the app. 😊`;
    } else if (tone === 'Professional') {
      subject = `Valued Loyalty Member Promotion: Account Update & Flights Vouchers`;
      intro = `Dear Valued Member, we are writing to update you regarding your ongoing ${m.card} card tier metrics. Currently, your account values stands at ${m.clv.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}.`;
      bodyText = `To support your travel schedule, we have initialized a Double Points Multiplier campaign on all international flight segments flown before the end of the quarter. Additionally, complimentary Hub Lounge pass vouchers have been allocated.`;
      CTA = `Please review these details and finalize bookings at your earliest convenience.`;
    } else {
      subject = `Urgent Update: Claim your expiring ${m.card} loyalty travel vouchers! ⚡`;
      intro = `Important: We notice your flight booking frequency has dropped. You have valuable points balance accumulated in your ${m.card} loyalty card account.`;
      bodyText = `To prevent point depreciation and secure your status tier limits, we have issued a 15% Fare Discount Voucher valid for any domestic flight booked in the next 14 days. These exclusive priority perks will expire if unredeemed.`;
      CTA = `Click here immediately or call our loyalty support line to reactivate your status.`;
    }

    return `Subject: ${subject}

${intro}

${bodyText}

${CTA}

Warm regards,
LoyaltyIQ Outreach Engagement Team`;
  };

  // Channel details based on segment
  const getChannelPill = (seg) => {
    const channels = {
      'Elite Loyalists': 'Channel: Exec Email & Push',
      'At-Risk Flyers': 'Channel: Email & Support Call',
      'Casual Travelers': 'Channel: App Push & SMS'
    };
    return channels[seg] || 'Channel: Standard Email';
  };

  // Render empty state if no member
  if (!member) {
    return (
      <div className="card p-6 bg-card border border-border/60 rounded-2xl text-center flex flex-col items-center justify-center py-8 text-text-secondary select-none count-up">
        <Mail className="h-8 w-8 text-text-secondary opacity-40 mb-2.5 animate-pulse" />
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">AI Email Writer Terminal</h4>
        <p className="text-[10px] text-text-secondary mt-1 max-w-[280px]">
          Please search or select a passenger profile to generate custom, AI-crafted retention campaign emails.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 bg-card-hover border border-border/80 rounded-2xl space-y-4 count-up select-none">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border/40">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-accent" /> AI CRM Retention Email Composer
        </h4>
        <span className="text-[10px] text-text-secondary font-medium">Model: {provider === 'gemini' ? 'gemini-1-5-flash' : provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-3-5'}</span>
      </div>

      {/* Tone Pills */}
      <div className="flex gap-2 items-center text-xs select-none">
        <span className="text-text-secondary font-semibold">Campaign Tone:</span>
        {['Friendly', 'Professional', 'Urgent'].map(tone => (
          <button
            key={tone}
            onClick={() => setSelectedTone(tone)}
            disabled={isDrafting}
            className={`px-3 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
              selectedTone === tone
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-bg border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {tone}
          </button>
        ))}
      </div>

      {/* Generate / Actions bar */}
      <div className="flex gap-2">
        <button
          onClick={handleDraftEmail}
          disabled={isDrafting}
          className="flex-1 bg-accent text-bg hover:opacity-90 active:scale-98 disabled:opacity-60 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md select-none text-xs border-none"
        >
          {isDrafting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 fill-current" />
          )}
          {isDrafting ? 'Drafting outreach copy...' : 'Generate Email Copy'}
        </button>

        {emailDraft && (
          <button
            onClick={handleDraftEmail}
            disabled={isDrafting}
            className="px-3 bg-card border border-border hover:bg-card-hover rounded-xl text-text-primary text-xs active:scale-95 transition-all cursor-pointer"
            title="Regenerate strategy copy"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content Render Panel */}
      {emailDraft && (
        <div className="space-y-2 mt-2 count-up">
          <div className="flex justify-between items-center text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
            <span className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-[9px] font-bold text-accent">
              {getChannelPill(member.segment)}
            </span>
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-1 hover:text-accent font-semibold bg-transparent border-none text-[10px] cursor-pointer text-text-secondary transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" /> Copied!
                </>
              ) : (
                <>
                  <Clipboard className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          <pre className={`p-4 bg-bg border border-border/80 rounded-xl text-xs leading-relaxed text-text-primary whitespace-pre-wrap max-h-[260px] overflow-y-auto font-sans focus:outline-none selection:bg-accent/20 ${
            isDrafting ? 'stream-cursor font-medium' : 'font-medium'
          }`}>
            {emailDraft}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmailWriter;
