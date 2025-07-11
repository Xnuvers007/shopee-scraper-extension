document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById("toggle-extension");
  const scrapeBtn = document.getElementById("scrapeBtn");

  chrome.storage.local.get("extensionEnabled", (data) => {
    const isEnabled = data.extensionEnabled !== false; // Default: true
    toggle.checked = isEnabled;
    scrapeBtn.disabled = !isEnabled;

    const statusText = document.getElementById("status-text");
    if (!isEnabled) {
      statusText.textContent = "Nonaktif";
      statusText.style.color = "var(--neutral-500)";
    } else {
      statusText.textContent = "Aktif";
      statusText.style.color = "var(--neutral-900)";
    }
  });

  toggle.addEventListener("change", (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
      console.log(`Ekstensi ${isEnabled ? "diaktifkan" : "dinonaktifkan"}`);
      scrapeBtn.disabled = !isEnabled;
      const statusText = document.getElementById("status-text");
      if (!isEnabled) {
        statusText.textContent = "Nonaktif";
        statusText.style.color = "var(--neutral-500)";
      } else {
        statusText.textContent = "Aktif";
        statusText.style.color = "var(--neutral-900)";
      }
    });
  });

document.getElementById("scrapeBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keyword").value.trim();
  const startPage = parseInt(document.getElementById("startPage").value, 10);
  const endPageInput = document.getElementById("endPage").value;
  const endPage = endPageInput ? parseInt(endPageInput, 10) : null;
  const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
  const status = document.getElementById("status");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const sortOption = document.getElementById("sortOption").value;
  const controlButtons = document.getElementById("controlButtons");

  const preferences = {
    keyword: keyword,
    startPage: startPage,
    endPage: endPage,
    exportFormat: exportFormat,
    sortOption: sortOption
  };
  chrome.storage.local.set({ preferences }, () => {
    console.log('Preferences saved:', preferences);
  }
  );

  if (!keyword || /[<>]/g.test(keyword)) {
    Swal.fire({
      title: 'Oops...',
      text: 'Kata kunci tidak boleh kosong atau mengandung karakter khusus!',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }

  if (endPage && startPage > endPage) {
    Swal.fire({
      title: 'Oops...',
      text: 'Halaman mulai tidak boleh lebih besar dari halaman akhir!',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }
  if (startPage < 1 || (endPage && endPage < 1)) {
    Swal.fire({
      title: 'Oops...',
      text: 'Halaman harus dimulai dari 1 atau lebih!',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    return;
  }  

  status.textContent = "Status: Membuka Shopee...";
  progressContainer.style.display = 'block';
  controlButtons.style.display = 'flex';
  progressBar.value = 0;
  progressText.textContent = '0%';

  document.getElementById("pauseBtn").disabled = false;
  document.getElementById("resumeBtn").disabled = true;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const encodedKeyword = encodeURIComponent(keyword);
  const searchURL = `https://shopee.co.id/search?keyword=${encodedKeyword}&page=${startPage - 1}`;
  
  try {
    new URL(searchURL);
    await chrome.tabs.update(tab.id, { url: searchURL });
  } catch (e) {
    console.error("Invalid URL generated:", e);
    status.textContent = "Status: Error - Invalid URL";
    return;
  }

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
          func: (startPage, endPage, exportFormat, keyword, sortOption) => {
            window.scrapingOptions = { 
              startPage, 
              endPage, 
              exportFormat, 
              keyword, 
              sortOption,
              isPaused: false
            };
          },
          args: [startPage, endPage, exportFormat, keyword, sortOption]
          
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

document.getElementById("pauseBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.scrapingOptions.isPaused = true;
    }
  });
  
  document.getElementById("pauseBtn").disabled = true;
  document.getElementById("resumeBtn").disabled = false;
  document.getElementById("status").textContent = "Status: Scraping dijeda...";
});

document.getElementById("resumeBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.scrapingOptions.isPaused = false;
      document.dispatchEvent(new CustomEvent('resumeScraping'));
    }
  });
  
  document.getElementById("pauseBtn").disabled = false;
  document.getElementById("resumeBtn").disabled = true;
  document.getElementById("status").textContent = "Status: Scraping dilanjutkan...";
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
        
        if (request.message.includes("Scraping selesai") || 
            request.message.includes("Selesai.")) {
            document.getElementById("controlButtons").style.display = 'none';
        }
    }
    if (request.type === "SHOW_NOTIFICATION") {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: request.title,
        message: request.message
      });
    } 
    sendResponse({ success: true });
    return true;    
});

document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("keydown", function(e) {
  if (e.key === "F12" || 
      (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) ||
      (e.ctrlKey && e.key.toLowerCase() === "u")) {
    e.preventDefault();
  }
  if (e.ctrlKey && e.key === "s") {
    document.getElementById("scrapeBtn").click();
  } else if (e.ctrlKey && e.key === "p") {
    document.getElementById("pauseBtn").click();
  } else if (e.ctrlKey && e.key === "r") {
    document.getElementById("resumeBtn").click();
  }
});

chrome.storage.local.get("preferences", (data) => {
  if (data.preferences) {
    document.getElementById("keyword").value = data.preferences.keyword || '';
    document.getElementById("startPage").value = data.preferences.startPage || 1;
    document.getElementById("endPage").value = data.preferences.endPage || '';
    document.querySelector(`input[name="exportFormat"][value="${data.preferences.exportFormat}"]`).checked = true;
    document.getElementById("sortOption").value = data.preferences.sortOption || 'default';
  }
});

chrome.storage.local.get("extensionEnabled", (data) => {
  const toggle = document.getElementById("toggle-extension");
  toggle.checked = data.extensionEnabled !== false; // default: true
});

document.getElementById("toggle-extension").addEventListener("change", (e) => {
  chrome.storage.local.set({ extensionEnabled: e.target.checked });
});
});