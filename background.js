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
});
