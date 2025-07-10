(async function () {
  const { startPage, endPage, exportFormat, keyword } = window.scrapingOptions;

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

  async function scrapePage() {
    updateStatus(`Menscrape halaman ${currentPage}...`);
    let lastHeight = 0;
    let sameHeightCount = 0;

    while (sameHeightCount < 5) {
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

    document.querySelectorAll('ul.shopee-search-item-result__items > li.shopee-search-item-result__item').forEach(li => {
      const name = li.querySelector('div.line-clamp-2')?.innerText.trim();
      const priceWhole = li.querySelector('.text-base\\/5')?.innerText?.trim();
      const pricePrefix = li.querySelector('.text-xs\\/sp14.font-medium')?.innerText?.trim();
      const link = li.querySelector('a')?.href;
      const locationLabel = li.querySelector('span[aria-label^="location-"]');
      const location = locationLabel ? locationLabel.nextElementSibling?.innerText.trim() : 'N/A';

      if (name && link && !scrapedItems.has(link)) {
        scrapedItems.add(link);
        allProducts.push({
          "Nama Produk": name,
          "Harga": `${pricePrefix || "Rp"} ${priceWhole || "N/A"}`,
          "Lokasi": location || "N/A",
          "Link": link
        });
      }
    });
  }

async function waitForPageRender(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
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

    while (currentPage <= endPage) {
      await scrapePage();
      updateProgress((currentPage / endPage) * 100);

      const nextButton = document.querySelector('.shopee-icon-button--right');
      if (!nextButton || nextButton.disabled) {
        updateStatus("Selesai. Tombol 'Berikutnya' tidak ditemukan atau dinonaktifkan.");
        break;
      }

      nextButton.click();
      await delay(3000);
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
    
    updateProgress(100);
  }
  
  function exportData() {
    const filename = `${keyword}_${new Date().toISOString().slice(0,10)}`;
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
      3: { cellWidth: 90 } // Link wrap
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
        txtString += `Nama Produk: ${item["Nama Produk"]}\n`;
        txtString += `Harga: ${item["Harga"]}\n`;
        txtString += `Lokasi: ${item["Lokasi"]}\n`;
        txtString += `Link: ${item["Link"]}\n\n`;
    });
    const blob = new Blob([txtString], { type: 'text/plain' });
    downloadBlob(blob, filename);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  startScraping();

})();
