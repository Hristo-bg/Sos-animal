// Server Status Monitor
function initServerStatus() {
  const serverStatus = document.getElementById('serverStatus');
  const statusText = document.getElementById('statusText');
  const statusMessage = document.getElementById('statusMessage');
  
  if (!serverStatus || !statusText || !statusMessage) {
    console.log('Server status elements not found');
    return;
  }
  
  async function checkServerStatus() {
    try {
      const response = await fetch('http://localhost:3333/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.database === 'disconnected') {
          updateServerStatus(true, 'Сървърът е онлайн, но базата данни е офлайн');
        } else {
          updateServerStatus(true, 'Свързано със SOS Animal');
        }
      } else {
        updateServerStatus(false, 'Сървърът отговаря с грешка');
      }
    } catch (error) {
      updateServerStatus(false, 'Сървърът не е наличен');
    }
  }
  
  function updateServerStatus(isOnline, message) {
    const indicator = serverStatus.querySelector('.status-indicator');
    
    if (isOnline) {
      indicator.classList.add('online');
      statusText.textContent = 'Онлайн';
      statusMessage.textContent = message;
      statusMessage.style.color = '#10b981';
    } else {
      indicator.classList.remove('online');
      statusText.textContent = 'Офлайн';
      statusMessage.textContent = message;
      statusMessage.style.color = '#ef4444';
    }
  }
  
  // Check status immediately and then every 30 seconds
  checkServerStatus();
  setInterval(checkServerStatus, 30000);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initServerStatus);
} else {
  initServerStatus();
}
