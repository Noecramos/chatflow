(function() {
  // 1. Parse Script Tag attributes for setup
  const scriptTag = document.currentScript;
  const botId = scriptTag.getAttribute('data-bot-id');
  const themeColor = scriptTag.getAttribute('data-theme-color') || '#8a2be2';
  const serverUrl = scriptTag.getAttribute('data-server-url') || new URL(scriptTag.src).origin;

  if (!botId) {
    console.error("ChatFlow Widget: Missing 'data-bot-id' attribute.");
    return;
  }

  // Generate unique session identifier per customer browser visitor
  let sessionId = localStorage.getItem(`chatflow_session_${botId}`);
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(`chatflow_session_${botId}`, sessionId);
  }

  // 2. Inject Widget DOM components directly into the document
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'chatflow-widget-container';
  widgetContainer.style.position = 'fixed';
  widgetContainer.style.bottom = '20px';
  widgetContainer.style.right = '20px';
  widgetContainer.style.zIndex = '999999';
  widgetContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  document.body.appendChild(widgetContainer);

  // Floating Bubble Button
  const bubbleButton = document.createElement('button');
  bubbleButton.id = 'chatflow-bubble-button';
  bubbleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  bubbleButton.style.width = '60px';
  bubbleButton.style.height = '60px';
  bubbleButton.style.borderRadius = '50%';
  bubbleButton.style.background = themeColor;
  bubbleButton.style.color = '#fff';
  bubbleButton.style.border = 'none';
  bubbleButton.style.cursor = 'pointer';
  bubbleButton.style.boxShadow = '0 6px 20px ' + themeColor + '66';
  bubbleButton.style.display = 'flex';
  bubbleButton.style.alignItems = 'center';
  bubbleButton.style.justifyContent = 'center';
  bubbleButton.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
  bubbleButton.style.outline = 'none';
  widgetContainer.appendChild(bubbleButton);

  // Chat window dialog
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chatflow-chat-window';
  chatWindow.style.position = 'absolute';
  chatWindow.style.bottom = '80px';
  chatWindow.style.right = '0';
  chatWindow.style.width = '370px';
  chatWindow.style.height = '500px';
  chatWindow.style.background = '#0e0e12';
  chatWindow.style.border = '1px solid #242430';
  chatWindow.style.borderRadius = '12px';
  chatWindow.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
  chatWindow.style.display = 'none';
  chatWindow.style.flexDirection = 'column';
  chatWindow.style.overflow = 'hidden';
  chatWindow.style.transition = 'all 0.3s';
  chatWindow.style.opacity = '0';
  chatWindow.style.transform = 'translateY(15px)';
  widgetContainer.appendChild(chatWindow);

  // Injected HTML Layout
  chatWindow.innerHTML = `
    <!-- Header -->
    <div style="background: #15151e; border-bottom: 1px solid #242430; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #25d366; box-shadow: 0 0 10px rgba(37, 211, 102, 0.5)"></div>
        <span style="font-weight: 700; color: #fff; font-size: 15px;">Zimmy</span>
      </div>
      <button id="chatflow-close" style="background: transparent; border: none; color: #7f7f9e; cursor: pointer; padding: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <!-- Messages list timeline -->
    <div id="chatflow-messages" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;"></div>

    <!-- Loading message element -->
    <div id="chatflow-loader" style="padding: 10px 16px; font-size: 11px; color: #7f7f9e; display: none; align-items: center; gap: 6px;">
      <span style="font-style: italic">Assistant is thinking...</span>
    </div>

    <!-- Message input form -->
    <form id="chatflow-form" style="border-top: 1px solid #242430; padding: 12px; display: flex; gap: 8px; background: #121218;">
      <input id="chatflow-input" type="text" placeholder="Type a message..." style="flex: 1; background: #20202b; border: 1px solid #2c2c3e; border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px; outline: none; transition: border-color 0.2s;" />
      <button type="submit" style="background: ${themeColor}; border: none; border-radius: 6px; padding: 0 12px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;

  const messagesContainer = chatWindow.querySelector('#chatflow-messages');
  const chatForm = chatWindow.querySelector('#chatflow-form');
  const chatInput = chatWindow.querySelector('#chatflow-input');
  const chatClose = chatWindow.querySelector('#chatflow-close');
  const loader = chatWindow.querySelector('#chatflow-loader');

  // Load Greeting message on boot
  appendMessage("Hello! Welcome to our store. How can I assist you with catalog searching, product checkouts, or support today?", 'BOT');

  // Toggle Visibility state
  let isOpen = false;
  
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.style.display = 'flex';
      setTimeout(() => {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = 'translateY(0)';
      }, 50);
      bubbleButton.style.transform = 'rotate(90deg)';
      bubbleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      chatWindow.style.opacity = '0';
      chatWindow.style.transform = 'translateY(15px)';
      setTimeout(() => {
        chatWindow.style.display = 'none';
      }, 300);
      bubbleButton.style.transform = 'rotate(0deg)';
      bubbleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    }
  }

  bubbleButton.addEventListener('click', toggleWidget);
  chatClose.addEventListener('click', toggleWidget);

  // Append single bubble message to scroller
  function appendMessage(text, sender) {
    const isBot = sender === 'BOT';
    const msg = document.createElement('div');
    msg.style.display = 'flex';
    msg.style.flexDirection = 'column';
    msg.style.alignItems = isBot ? 'flex-start' : 'flex-end';
    msg.style.alignSelf = isBot ? 'flex-start' : 'flex-end';
    msg.style.maxWidth = '85%';

    msg.innerHTML = `
      <div style="
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 13px;
        line-height: 1.4;
        word-break: break-word;
        background: ${isBot ? '#20202b' : themeColor};
        color: #fff;
        border: 1px solid ${isBot ? '#2d2d3d' : 'transparent'};
      ">
        ${text}
      </div>
    `;

    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle message submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    appendMessage(text, 'USER');
    
    // Display thinking indicator
    loader.style.display = 'flex';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const res = await fetch(`${serverUrl}/inbox/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: botId,
          sessionId: sessionId,
          message: text
        })
      });

      const data = await res.json();
      
      loader.style.display = 'none';

      if (data.success) {
        appendMessage(data.reply, 'BOT');
      } else {
        appendMessage("Sorry, I encountered a connection timeout. Please verify backend connection status.", 'BOT');
      }
    } catch (err) {
      loader.style.display = 'none';
      appendMessage("Sorry, we are unable to establish server connection.", 'BOT');
    }
  });

})();
