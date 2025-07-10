chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['libs/xlsx.full.min.js']
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    console.log('✅ Scripts injected successfully');
  } catch (err) {
    console.error('❌ Gagal inject scripts:', err);
  }
  chrome.action.setPopup({ popup: 'popup.html' });
  chrome.action.openPopup();
  chrome.action.setBadgeText({ text: 'ON' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  chrome.action.setTitle({ title: 'Scraping aktif' });
  console.log('✅ Popup opened and badge set');
  chrome.tabs.sendMessage(tab.id, { action: 'startScraping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('✅ Message sent to content script:', response);
    }
  });
  chrome.storage.local.set({ scrapingActive: true }, () => {
    console.log('✅ Scraping state saved');
  });
});
