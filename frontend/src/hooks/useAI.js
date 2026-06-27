import { useContext } from 'react';
import { ApiKeyContext } from '../context/ApiKeyContext';
import { fetchStream } from '../utils/stream';

export const useAI = () => {
  const { apiKey, provider } = useContext(ApiKeyContext);
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const streamChat = (message, history, onToken, onDone, onError) => {
    // If no backend endpoint or API Key is set, default to a robust local mock streamer
    if (!apiUrl && !apiKey) {
      return mockStream(`Hello! I'm your LoyaltyIQ Strategy Assistant. Based on our airline loyalty metrics:
      
- **Demographics**: Ontario holds the highest density (5,404 members), followed closely by British Columbia (4,409 members).
- **Churn Analysis**: The average churn risk is heavily tied to card tiers; Star card members exhibit the highest risk, while Aurora tier members are highly stable.
- **CLV Distribution**: The average CLV is CAD $7,988.90, but we have 376 extreme outliers with CLVs exceeding CAD $25,000 who require dedicated concierge care.

How else can I assist you with passenger behavioral insights today?`, onToken, onDone);
    }

    const body = {
      apiKey,
      message,
      history,
      provider,
    };
    return fetchStream(`${apiUrl}/chat`, body, onToken, onDone, onError);
  };

  const generateEmail = (member, onToken, onDone, onError) => {
    if (!apiUrl && !apiKey) {
      return mockStream(`Subject: Exclusive Loyalty Offers & Bonus Flights for Loyalty IQ Member #${member.loyaltyNumber}

Dear Member,

We noticed that you have been a valuable member of our loyalty program since ${member.enrollmentYear} in ${member.province}. Currently, you hold a **${member.card}** card tier and have achieved a Customer Lifetime Value of **${member.clv.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}**.

To show our appreciation for your loyalty, we want to help you maximize your benefits:
1. **Redemption Bonus**: Enjoy a 15% points redemption discount on all domestic flights booked in the next 30 days.
2. **Double Points**: Earn double points on all international segments flown between now and the end of the quarter.
3. **Upgrade Opportunities**: As an esteemed ${member.card} cardholder, you will receive priority upgrade consideration.

If you have any questions or need assistance booking your next flight, please reply directly.

Best regards,

LoyaltyIQ Engagement Team`, onToken, onDone);
    }

    const body = {
      apiKey,
      member,
      provider,
    };
    return fetchStream(`${apiUrl}/generate-email`, body, onToken, onDone, onError);
  };

  const narrateChart = (chartType, chartData, onToken, onDone, onError) => {
    if (!apiUrl && !apiKey) {
      let description = '';
      if (chartType === 'Churn Risk Distribution' || chartType.includes('Churn')) {
        description = `<think>
- Analyzing user-requested Churn Risk Distribution chart query.
- No active filter payload provided; falling back to global model metrics cache.
- Examining bimodal distribution patterns in global data (N = 16,734).
- Isolating peak high-risk cohort (N = 2,067, 100% risk) vs. stable low-risk cohort (0-20% risk).
- Formulating risk mitigation strategy targeting the transitionary segment (40-70% risk).
</think>
- **Key Observation**: The loyalty database exhibits a distinct bimodal churn profile. A large, stable customer core resides in the 0-20% low-risk range, while a subset of 2,067 members is classified at 100% risk (already deactivated or churned).
- **Risk Assessment**: The high concentration of inactive members indicates substantial historical disengagement, while the moderate-risk cohort represents the primary threat surface for upcoming churn.
- **Strategy Recommendation**: Focus proactive win-back and retention campaigns on the 40-70% moderate-risk flyers, who show early warning signs of disengagement but remain salvageable with targeted, high-value incentives.`;
      } else if (chartType.includes('Province')) {
        description = `<think>
- Processing Province Distribution query.
- No active member filter present; pulling cached regional demographics summary.
- Evaluating geographic distribution across all provinces.
- Ontario (ON), British Columbia (BC), and Quebec (QC) identified as dominant hubs.
- Formulating localized route promotions based on regional passenger hubs.
</think>
- **Key Observation**: Geographic distribution is highly concentrated, with Ontario (ON), British Columbia (BC), and Quebec (QC) collectively representing over 75% of the overall passenger base.
- **Market Dynamics**: Secondary regions represent a fragmented footprint, meaning marketing efficiency is maximized by focusing on the primary hub networks.
- **Strategy Recommendation**: Launch route-specific loyalty campaigns tailored to departures from major hubs (YYZ in Toronto, YVR in Vancouver, and YUL in Montreal) to capture high-density regional passenger volumes.`;
      } else {
        description = `<think>
- Querying default dynamic narration model for chart type: "${chartType}".
- No custom data payload provided. Utilizing baseline loyalty behavior models.
- Correlating loyalty points accumulation behaviors with member redemptions.
- Evaluating point-multiplier strategy for low-travel cycles.
</think>
- **Key Observation**: Active loyalty members demonstrate a high correlation between points accumulation frequency and flight redemption actions, proving program utility.
- **Engagement Profile**: Standard and Casual tiers exhibit lower point velocity, showing a higher risk of disengagement during off-peak travel seasons.
- **Strategy Recommendation**: Implement targeted point-multiplier promotions during seasonal travel troughs to maintain active booking velocities among entry-level cardholders.`;
      }

      return mockStream(description, onToken, onDone);
    }

    const body = {
      apiKey,
      chartType,
      chartData,
      provider,
    };
    return fetchStream(`${apiUrl}/narrate-chart`, body, onToken, onDone, onError);
  };

  const generateStrategy = (segmentName, onToken, onDone, onError) => {
    if (!apiUrl && !apiKey) {
      let details = '';
      if (segmentName === 'Elite Loyalists') {
        details = `### Summary
Keep our top tier flyers highly active. Elite Loyalists represent 18% of members but drive over 45% of total airline flight invoice revenue. Keep satisfaction high.
### Signals
High flight counts, high CLV (avg CAD $15K+), low risk score. Mostly Aurora card holders with anniversary signup patterns.
### Hidden Risk
Competitor matches. Top tier competitors may target them with status-match promotions to siphon high-value accounts.
### 90-Day Plan
1. Launch direct VIP helpdesk priority line access.
2. Schedule surprise upgrades on milestones.
3. Invite to exclusive premium events in Vancouver and Toronto.
### Metrics
Target <5% churn risk maintenance, high partner lounge check-in volumes, and stable YoY flight schedules.
### Don't Do
Do not reduce point accumulation multipliers or add blackout dates to their flight bookings.`;
      } else if (segmentName === 'At-Risk Flyers') {
        details = `### Summary
Re-engage disengaged flyers quickly to prevent opt-outs. These members show declining flight counts and point redemptions.
### Signals
90-day inactive flight status, falling redemption ratios, and Star card tier balances.
### Hidden Risk
Inactive points balance. Unused points represent a balance-sheet liability and signal disengagement.
### 90-Day Plan
1. Email double-points upgrade offers for next booked trip.
2. Send a personalized email matching their top province routes.
3. Execute direct phone outreach for Star tier members with high CLV.
### Metrics
Target 28% churn risk reduction and recovery of an estimated $1.2M in CLV.
### Don't Do
Do not ignore inactive accounts; avoid generic non-customized generic emails.`;
      } else {
        details = `### Summary
Build brand preference among infrequent flyers. Standard and Casual travelers have low flight frequency but high lifetime growth potential.
### Signals
1-2 flights annually, standard card tiers, and low point redemption rates.
### Hidden Risk
Complete disengagement. If not targeted, they will transition to competitor options for cheaper single flights.
### 90-Day Plan
1. Target with low-cost flight alerts and promotional fare sales.
2. Offer entry-level partner benefits to spark program interest.
3. Schedule weekend companion travel bonus point events.
### Metrics
Target 12% churn reduction rate, increasing lifetime point redeems.
### Don't Do
Do not spam with daily non-discounted emails or offer complex tier requirements.`;
      }

      return mockStream(details, onToken, onDone);
    }

    const body = {
      apiKey,
      segmentName,
      provider,
    };
    return fetchStream(`${apiUrl}/generate-strategy`, body, onToken, onDone, onError);
  };

  return {
    streamChat,
    generateEmail,
    narrateChart,
    generateStrategy
  };
};

// Simulated token-by-token text streamer
const mockStream = (text, onToken, onDone) => {
  // Split text by word boundary to create realistic token chunks
  const tokens = text.split(/(\s+)/);
  let index = 0;

  const interval = setInterval(() => {
    if (index >= tokens.length) {
      clearInterval(interval);
      onDone();
      return;
    }
    onToken(tokens[index]);
    index++;
  }, 25); // 25ms spacing matches standard token-generation speeds

  return {
    abort: () => {
      clearInterval(interval);
      onDone();
    }
  };
};
