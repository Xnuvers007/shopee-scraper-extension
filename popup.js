document.getElementById("scrapeBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keyword").value.trim();
  const startPage = parseInt(document.getElementById("startPage").value, 10);
  const endPage = document.getElementById("endPage").value ? parseInt(document.getElementById("endPage").value, 10) : Infinity;
  const exportFormat = document.getElementById("exportFormat").value;
  const status = document.getElementById("status");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (!keyword) {
    Swal.fire({
      title: 'Oops...',
      text: 'Kata kunci tidak boleh kosong!',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  status.textContent = "Status: Membuka Shopee...";
  progressContainer.style.display = 'block';
  progressBar.value = 0;
  progressText.textContent = '0%';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const searchURL = `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}&page=${startPage - 1}`;
  await chrome.tabs.update(tab.id, { url: searchURL });

  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'libs/xlsx.full.min.js', 
          'libs/jspdf.umd.min.js', 
          'libs/jspdf.plugin.autotable.js',
          'libs/sweetalert2.all.min.js'
        ]
      }).then(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (startPage, endPage, exportFormat, keyword) => {
            window.scrapingOptions = { startPage, endPage, exportFormat, keyword };
          },
          args: [startPage, endPage, exportFormat, keyword]
        }).then(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          status.textContent = "Status: Scraping sedang berjalan...";
        });
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SCRAPING_PROGRESS") {
        const progressBar = document.getElementById("progressBar");
        const progressText = document.getElementById("progressText");
        progressBar.value = request.progress;
        progressText.textContent = `${Math.round(request.progress)}%`;
    }
     if (request.type === "SCRAPING_STATUS") {
        const status = document.getElementById("status");
        status.textContent = `Status: ${request.message}`;
    }
});
