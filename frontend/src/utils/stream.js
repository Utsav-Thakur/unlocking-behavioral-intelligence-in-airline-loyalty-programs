// stream.js

/**
 * Connects to a streaming endpoint using Server-Sent Events (SSE) style response.
 * Uses ReadableStream + TextDecoder to parse 'data: token\n\n' format.
 * Stops on '[DONE]' and returns an AbortController.
 */
export const fetchStream = (url, body, onToken, onDone, onError) => {
  const controller = new AbortController();
  const signal = controller.signal;

  // If apiKey is passed inside the body, we can also forward it as an Authorization header
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (body && body.apiKey) {
    headers['Authorization'] = `Bearer ${body.apiKey}`;
    headers['X-API-Key'] = body.apiKey;
  }

  fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;

          if (trimmed.startsWith('data:')) {
            const dataContent = trimmed.slice(5).trim();
            if (dataContent === '[DONE]') {
              onDone();
              return;
            }
            // Sometimes the SSE format might send JSON or literal tokens.
            // If it starts and ends with double quotes, or is a JSON string, let's parse it safely
            let token = dataContent;
            try {
              if ((token.startsWith('"') && token.endsWith('"')) || 
                  (token.startsWith('{') && token.endsWith('}'))) {
                const parsed = JSON.parse(token);
                token = typeof parsed === 'object' ? parsed.token || parsed.choices?.[0]?.delta?.content || token : parsed;
              }
            } catch (e) {
              // Not JSON, use as is
            }
            onToken(token);
          }
        }
      }
      
      onDone();
    })
    .catch((err) => {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        onError(err);
      }
    });

  return controller;
};
