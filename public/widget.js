(function() {
  // Get config from the script tag
  const script = document.currentScript;
  const botSlug = script.getAttribute('data-bot-slug');
  const primaryColor = script.getAttribute('data-color') || '#4F46E5';

  if (!botSlug) {
    console.error('IntakeOS: No data-bot-slug provided');
    return;
  }

  // 1. Create the floating button ("The Bubble")
  const button = document.createElement('div');
  button.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
    background: ${primaryColor}; border-radius: 50%; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; 
    justify-content: center; z-index: 999999; transition: transform 0.2s;
  `;
  // Chat Icon SVG
  button.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  // 2. Create the Iframe Container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; bottom: 100px; right: 20px; width: 380px; height: 600px; max-height: 80vh;
    background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    z-index: 999999; display: none; overflow: hidden; border: 1px solid #e2e8f0;
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out; 
    opacity: 0; transform: translateY(20px);
  `;

  // 3. Create the Iframe
  // NOTE: In development, change 'intakeos.com' to 'localhost:3000' or your Vercel URL
  // We use window.location.origin to make it work automatically in dev/prod
  const baseUrl = script.src.includes('localhost') ? 'http://localhost:3000' : new URL(script.src).origin;
  
  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/chat/${botSlug}?mode=widget`;
  iframe.style.cssText = "width: 100%; height: 100%; border: none;";
  
  container.appendChild(iframe);
  document.body.appendChild(button);
  document.body.appendChild(container);

  // 4. Toggle Logic
  let isOpen = false;
  button.onclick = () => {
    isOpen = !isOpen;
    if (isOpen) {
      container.style.display = 'block';
      // Trigger animation
      requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      });
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      container.style.opacity = '0';
      container.style.transform = 'translateY(20px)';
      setTimeout(() => container.style.display = 'none', 200);
      button.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  };
})();