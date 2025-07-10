document.getElementById("scrapeBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keyword").value.trim();
  const status = document.getElementById("status");

  if (!keyword) {
    alert("Masukkan kata kunci terlebih dahulu!");
    return;
  }

  status.textContent = "Status: Membuka Shopee...";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const searchURL = `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`;
  await chrome.tabs.update(tab.id, { url: searchURL });

  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === "complete") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['libs/xlsx.full.min.js']
      }).then(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        status.textContent = "Status: Scraping sedang berjalan...";
        chrome.tabs.onUpdated.removeListener(listener);
      });
    }
  });
});
