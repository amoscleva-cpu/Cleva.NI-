
    class ClevaNI {
      constructor(apiUrl) {
        this.apiUrl = apiUrl;
      }
      
      async sendMessage(userText) {
        try {
          const url = `${this.apiUrl}?text=${encodeURIComponent(userText)}`;
          console.log('Calling API:', url);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Raw API Response:', data);
          return data;
        } catch (error) {
          console.error('API Error:', error);
          return {
            error: true,
            message: `😜 API Connection Error: ${error.message}\n\nThe server may be temporarily unavailable. Please try again in a moment.`
          };
        }
      }
    }
    
    // Initialize Cleva NI with NEW API endpoint
    const clevaNI = new ClevaNI('https://apis.davidcyril.name.ng/ai/felo');
    
    // DOM Elements
    const messagesContainer = document.getElementById('messages-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    
    let isSending = false;
    let welcomeRemoved = false;
    
    // Add message to chat
    function addMessage(text, isUser, timestamp = new Date()) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
      
      const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      messageDiv.innerHTML = `
                <div>
                    <div class="message-content">${escapeHtml(text)}</div>
                    <div class="message-time">${isUser ? 'You' : 'Cleva NI'} • ${timeStr}</div>
                </div>
            `;
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Extract ONLY the AI's main response from various possible JSON structures
    function extractAIResponse(data) {
      // If it's an error
      if (data.error) {
        return data.message;
      }
      
      // If it's a string, return it directly
      if (typeof data === 'string') {
        return data;
      }
      
      // Common response field names from various APIs
      const possibleFields = [
        'response',
        'text',
        'message',
        'content',
        'reply',
        'answer',
        'generated_text',
        'output',
        'result',
        'data',
        'candidates',
        'choices',
        'ai_response',
        'bot_response'
      ];
      
      // Check each possible field
      for (const field of possibleFields) {
        if (data[field]) {
          // Handle Gemini's candidates structure
          if (field === 'candidates' && Array.isArray(data[field]) && data[field][0]) {
            const candidate = data[field][0];
            if (candidate.content) return candidate.content;
            if (candidate.text) return candidate.text;
            if (candidate.message) return candidate.message;
            return JSON.stringify(candidate);
          }
          
          // Handle OpenAI's choices structure
          if (field === 'choices' && Array.isArray(data[field]) && data[field][0]) {
            const choice = data[field][0];
            if (choice.message?.content) return choice.message.content;
            if (choice.text) return choice.text;
            return JSON.stringify(choice);
          }
          
          // Direct field value
          if (typeof data[field] === 'string') return data[field];
          if (typeof data[field] === 'object') return JSON.stringify(data[field]);
        }
      }
      
      // If no known field found, return a user-friendly message
      console.warn('Unknown response format:', data);
      return "❤️‍🔥⚙️ I've received your message and processed it successfully.🤗";
    }
    
    // Send message to NI
    async function sendMessage() {
      const text = userInput.value.trim();
      
      // Don't send empty messages or while already sending
      if (!text || isSending) return;
      
      // Remove welcome message on first message
      if (!welcomeRemoved) {
        const welcomeDiv = document.querySelector('.welcome-message');
        if (welcomeDiv) welcomeDiv.remove();
        welcomeRemoved = true;
      }
      
      // Clear input and reset height
      userInput.value = '';
      userInput.style.height = 'auto';
      
      // Add user message
      addMessage(text, true);
      
      // Disable send button and show typing indicator
      isSending = true;
      sendBtn.disabled = true;
      typingIndicator.classList.add('active');
      
      try {
        // Get AI response
        const response = await clevaNI.sendMessage(text);
        
        // Extract only the main NI response
        const aiText = extractAIResponse(response);
        
        // Add AI response (clean, no raw JSON)
        addMessage(aiText, false);
      } catch (error) {
        addMessage(`😜 System Error: ${error.message}\n\nPlease check your connection and try again.`, false);
      } finally {
        // Re-enable send button and hide typing indicator
        isSending = false;
        sendBtn.disabled = false;
        typingIndicator.classList.remove('active');
        userInput.focus();
      }
    }
    
    // Auto-resize textarea
    function autoResizeTextarea() {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
    }
    
    // Event Listeners
    sendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      sendMessage();
    });
    
    userInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    userInput.addEventListener('input', autoResizeTextarea);
    
    // Focus on input on load
    userInput.focus();
    
    // Test API on load
    async function testConnection() {
      try {
        const testResponse = await fetch('https://apis.davidcyril.name.ng/ai/felo?text=test');
        if (testResponse.ok) {
          console.log('🌟🎉 API connection successful');
        } else {
          console.warn('😜 API returned status:', testResponse.status);
        }
      } catch (error) {
        console.warn('😜 API connection test failed:', error.message);
      }
    }
    testConnection();