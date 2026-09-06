

// ─── DOM Elements ──────────────────────────────────────
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const charCount = document.getElementById('charCount');
const clearChatBtn = document.getElementById('clearChatBtn');
const clearBtnHeader = document.getElementById('clearChatBtnHeader');
const quickActions = document.getElementById('quickActions');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

// ─── State ─────────────────────────────────────────────
let isLoading = false;

// ─── Utility: Current Time ─────────────────────────────
function getCurrentTime() {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Utility: Simple Markdown Parser ──────────────────
function parseMarkdown(text) {
  return text
    // Code block (multi-line) — must be before inline code
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Heading H2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Heading H3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Unordered list items
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    // Numbered list items
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Double newline → paragraph break
    .replace(/\n\n/g, '</p><p>')
    // Single newline → <br>
    .replace(/\n/g, '<br>')
    // Wrap in paragraph if not already a block element
    .replace(/^(?!<[hup]|<pre|<ul|<ol)(.+)/gm, (match) => {
      if (match.trim() === '') return '';
      return match;
    });
}

// ─── Render Message ────────────────────────────────────
function addMessage(text, sender = 'bot') {
  const isBot = sender === 'bot';

  const messageEl = document.createElement('div');
  messageEl.classList.add('message', isBot ? 'bot-message' : 'user-message');

  const avatarEl = document.createElement('div');
  avatarEl.classList.add('avatar');
  avatarEl.textContent = isBot ? '📚' : '🧑';

  const bubbleEl = document.createElement('div');
  bubbleEl.classList.add('bubble');

  if (isBot) {
    bubbleEl.innerHTML = `<p>${parseMarkdown(text)}</p>`;
  } else {
    // User text: escape HTML for safety
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    bubbleEl.innerHTML = `<p>${safe}</p>`;
  }

  const timeEl = document.createElement('span');
  timeEl.classList.add('bubble-time');
  timeEl.textContent = getCurrentTime();
  bubbleEl.appendChild(timeEl);

  messageEl.appendChild(avatarEl);
  messageEl.appendChild(bubbleEl);

  chatMessages.appendChild(messageEl);
  scrollToBottom();

  return messageEl;
}

// ─── Scroll to Bottom ──────────────────────────────────
function scrollToBottom() {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth',
  });
}

// ─── Show / Hide Loading ───────────────────────────────
function showLoading() {
  typingIndicator.classList.add('visible');
  sendBtn.disabled = true;
  messageInput.disabled = true;
  isLoading = true;
  scrollToBottom();
}

function hideLoading() {
  typingIndicator.classList.remove('visible');
  sendBtn.disabled = false;
  messageInput.disabled = false;
  isLoading = false;
  messageInput.focus();
}

// ─── Send Message to Backend ───────────────────────────
async function sendMessage(text) {
  if (!text.trim() || isLoading) return;

  // Add user message to UI
  addMessage(text, 'user');

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  charCount.textContent = '0';

  // Show loading
  showLoading();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();

    hideLoading();

    if (response.ok) {
      addMessage(data.reply, 'bot');
    } else {
      addMessage(`Oops! ${data.error || 'Terjadi kesalahan. Coba lagi ya! 😅'}`, 'bot');
    }
  } catch (error) {
    hideLoading();
    addMessage('Aduh, sepertinya koneksi bermasalah 😢 Pastikan server sudah berjalan dan coba lagi ya!', 'bot');
    console.error('[BelajarKuy] Fetch error:', error);
  }
}

// ─── Form Submit ───────────────────────────────────────
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (text) sendMessage(text);
});

// ─── Enter to Send (Shift+Enter for newline) ───────────
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text) sendMessage(text);
  }
});

// ─── Auto-resize Textarea ──────────────────────────────
messageInput.addEventListener('input', () => {
  // Char count
  charCount.textContent = messageInput.value.length;

  // Auto resize
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
});

// ─── Quick Action Buttons ──────────────────────────────
quickActions.addEventListener('click', (e) => {
  const btn = e.target.closest('.quick-btn');
  if (!btn) return;

  const prompt = btn.dataset.prompt;
  messageInput.value = prompt;
  messageInput.focus();
  messageInput.style.height = 'auto';
  messageInput.style.height = messageInput.scrollHeight + 'px';
  charCount.textContent = prompt.length;

  // Close sidebar on mobile
  sidebar.classList.remove('open');
});

// ─── Clear Chat ────────────────────────────────────────
function clearChat() {
  // Remove all messages except welcome
  const messages = chatMessages.querySelectorAll('.message:not(#welcomeMsg)');
  messages.forEach((msg) => {
    msg.style.animation = 'none';
    msg.style.opacity = '0';
    msg.style.transform = 'translateY(-8px)';
    msg.style.transition = 'all 0.2s ease';
    setTimeout(() => msg.remove(), 200);
  });
}

clearChatBtn?.addEventListener('click', clearChat);
clearBtnHeader?.addEventListener('click', clearChat);

// ─── Mobile Sidebar Toggle ─────────────────────────────
sidebarToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside (mobile)
document.addEventListener('click', (e) => {
  if (
    window.innerWidth <= 700 &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('open');
  }
});

// ─── Focus input on load ───────────────────────────────
window.addEventListener('load', () => {
  messageInput.focus();
});
