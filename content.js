(async function () {
  const { startPage, endPage, exportFormat, keyword, sortOption } = window.scrapingOptions;
  window.scrapingOptions.isPaused = false;

  const delay = ms => new Promise(res => setTimeout(res, ms));
  const SCROLL_STEP = 500;
  const SCROLL_DELAY = 1000;

  const allProducts = [];
  const scrapedItems = new Set();
  let currentPage = startPage;

  function updateStatus(message) {
      chrome.runtime.sendMessage({ type: "SCRAPING_STATUS", message });
  }

  function updateProgress(progress) {
      chrome.runtime.sendMessage({ type: "SCRAPING_PROGRESS", progress });
  }

  document.addEventListener('resumeScraping', () => {
    updateStatus(`Melanjutkan scraping pada halaman ${currentPage}...`);
    startScraping();
  });

  async function scrapePage() {
    updateStatus(`Menscrape halaman ${currentPage}...`);
    let lastHeight = 0;
    let sameHeightCount = 0;

    while (sameHeightCount < 5) {
        while (window.scrapingOptions.isPaused) {
            await delay(500);
        }
        
        window.scrollBy(0, SCROLL_STEP);
        await delay(SCROLL_DELAY);
        const newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight) {
            sameHeightCount++;
        } else {
            sameHeightCount = 0;
            lastHeight = newHeight;
        }
    }

    try {
      document.querySelectorAll('ul.shopee-search-item-result__items > li.shopee-search-item-result__item').forEach(li => {
        try {
          const name = li.querySelector('div.line-clamp-2')?.innerText?.trim() || "N/A";
          const priceWhole = li.querySelector('.text-base\\/5')?.innerText?.trim() || "N/A";
          const pricePrefix = li.querySelector('.text-xs\\/sp14.font-medium')?.innerText?.trim() || "Rp";
          const link = li.querySelector('a')?.href;
          const locationLabel = li.querySelector('span[aria-label^="location-"]');
          const location = locationLabel ? locationLabel.nextElementSibling?.innerText?.trim() || "N/A" : 'N/A';
  
          if (name && link && !scrapedItems.has(link)) {
            scrapedItems.add(link);
            allProducts.push({
              "Nama Produk": name,
              "Harga": `${pricePrefix || "Rp"} ${priceWhole || "N/A"}`,
              "Lokasi": location || "N/A",
              "Link": link || "N/A"    
            });
          }
        } catch (itemError) {
          console.error("Error extracting product data:", itemError);
          Swal.fire({
            title: 'Kesalahan Saat Mengambil Data Produk',
            text: `Produk mungkin tidak lengkap atau tidak dapat diakses. Kesalahan: ${itemError.message}`,
            icon: 'error'
          });
          updateStatus(`Kesalahan saat mengambil data produk: ${itemError.message}`);
          throw itemError;
        }
      });
    } catch (error) {
      console.error("Error during page scraping:", error);
      updateStatus(`Error saat scraping: ${error.message}`);
    }
  }

async function waitForPageRender(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.scrapingOptions.isPaused) {
      await delay(500);
      continue;
    }
    
    if (document.querySelector(selector)) {
      return true;
    }
    await delay(500);
  }
  throw new Error(`Elemen "${selector}" tidak ditemukan dalam ${timeout / 1000} detik.`);
}

  async function startScraping() {
    Swal.fire({
      title: 'Memulai Scraping!',
      text: 'Proses scraping sedang berjalan, mohon tunggu...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await waitForPageRender('ul.shopee-search-item-result__items > li');

    while (!endPage || currentPage <= endPage) {
      while (window.scrapingOptions.isPaused) {
        await delay(500);
      }
      
      await scrapePage();
      updateProgress(endPage ? (currentPage / endPage) * 100 : 0);
    
      const nextButton = document.querySelector('.shopee-icon-button--right');
      if (!nextButton || nextButton.disabled) {
        updateStatus("Selesai. Tombol 'Berikutnya' tidak ditemukan atau dinonaktifkan.");
        break;
      }
      
      while (window.scrapingOptions.isPaused) {
        await delay(500);
      }
    
      nextButton.click();
      await delay(3000);
      await waitForPageRender('ul.shopee-search-item-result__items > li');
      currentPage++;
    }

    Swal.close();

    if (allProducts.length > 0) {
      Swal.fire({
        title: 'Scraping Selesai!',
        text: `Ditemukan ${allProducts.length} produk. File akan segera diunduh.`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
      exportData();
    } else {
      Swal.fire({
        title: 'Tidak Ada Hasil',
        text: 'Tidak ada produk yang ditemukan untuk kata kunci tersebut.',
        icon: 'warning'
      });
    }
    showNotification("Scraping Selesai", `Pencarian Mengenai "${keyword}" telah selesai. ${allProducts.length} produk berhasil diekspor.`);
    updateStatus("Scraping selesai.");
    
    updateProgress(100);
  }

  function showNotification(title, message) {
    chrome.runtime.sendMessage({
      type: "SHOW_NOTIFICATION",
      title,
      message
    });
  }  
  
  function exportData() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10);
    const timeStr = now.getHours().toString().padStart(2, '0') + 
                   now.getMinutes().toString().padStart(2, '0') + 
                   now.getSeconds().toString().padStart(2, '0');
    const filename = `${keyword}_${dateStr}_${timeStr}`;
    if (sortOption === 'price-asc' || sortOption === 'price-desc') {
      allProducts.sort((a, b) => {
        const parsePrice = str => {
          const match = str.match(/[\d.]+/g);
          return match ? parseInt(match.join('').replace(/\./g, '')) : 0;
        };
        const priceA = parsePrice(a["Harga"]);
        const priceB = parsePrice(b["Harga"]);
        return sortOption === 'price-asc' ? priceA - priceB : priceB - priceA;
      });
    }
    if (sortOption === 'name-asc' || sortOption === 'name-desc') {
      allProducts.sort((a, b) => {
        const nameA = a["Nama Produk"].toLowerCase();
        const nameB = b["Nama Produk"].toLowerCase();
        return sortOption === 'name-asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
    );
    }
    if (sortOption === 'location-asc' || sortOption === 'location-desc') {
      allProducts.sort((a, b) => {
        const locA = a["Lokasi"].toLowerCase();
        const locB = b["Lokasi"].toLowerCase();
        return sortOption === 'location-asc' ? locA.localeCompare(locB) : locB.localeCompare(locA);
      });
    }
    if (sortOption === 'link-asc' || sortOption === 'link-desc') {
      allProducts.sort((a, b) => {
        const linkA = a["Link"].toLowerCase();
        const linkB = b["Link"].toLowerCase();
        return sortOption === 'link-asc' ? linkA.localeCompare(linkB) : linkB.localeCompare(linkA);
      }
    );
    }
    if (allProducts.length === 0) {
      Swal.fire({
        title: 'Tidak Ada Produk',
        text: 'Tidak ada produk yang ditemukan untuk kata kunci tersebut.',
        icon: 'warning'
      });
      return;
    }
    if (!exportFormat) {
      Swal.fire({
        title: 'Format Ekspor Tidak Dipilih',
        text: 'Silakan pilih format ekspor sebelum melanjutkan.',
        icon: 'warning'
      });
      return;
    }
    if (!filename) {
      Swal.fire({
        title: 'Nama File Tidak Valid',
        text: 'Nama file tidak boleh kosong atau mengandung karakter yang tidak valid.',
        icon: 'warning'
      });
      return;
    }
      
    switch (exportFormat) {
      case 'xlsx':
        exportToXLSX(allProducts, `${filename}.xlsx`);
        break;
      case 'pdf':
        exportToPDF(allProducts, `${filename}.pdf`);
        break;
      case 'json':
        exportToJSON(allProducts, `${filename}.json`);
        break;
      case 'txt':
        exportToTXT(allProducts, `${filename}.txt`);
        break;
    }
  }

  function exportToXLSX(data, filename) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Produk');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(new Blob([wbout], { type: 'application/octet-stream' }), filename);
  }

function exportToPDF(data, filename) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(14);
  doc.text("Daftar Produk Shopee", 14, 15);

  doc.autoTable({
    startY: 20,
    head: [['Nama Produk', 'Harga', 'Lokasi', 'Link']],
    body: data.map(item => [
      item['Nama Produk'],
      item['Harga'],
      item['Lokasi'],
      item['Link']
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 2,
      valign: 'top',
    },
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 100 }
    }
  });

  doc.save(filename);
}


  function exportToJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, filename);
  }

  function exportToTXT(data, filename) {
    let txtString = "";
    data.forEach(item => {
      const sanitizedName = item["Nama Produk"].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const sanitizedHarga = item["Harga"].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const sanitizedLokasi = item["Lokasi"].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const sanitizedLink = item["Link"].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      txtString += `Nama Produk: ${sanitizedName}\n`;
      txtString += `Harga: ${sanitizedHarga}\n`;
      txtString += `Lokasi: ${sanitizedLokasi}\n`;
      txtString += `Link: ${sanitizedLink}\n\n`;
    });
    const blob = new Blob([txtString], { type: 'text/plain' });
    downloadBlob(blob, filename);
    }

  function downloadBlob(blob, filename) {
    const safeFilename = filename.replace(/[^\w\s.-]/gi, '_');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
      setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  startScraping();
  
})();