(async function () {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const SCROLL_STEP = 300;
  const SCROLL_DELAY = 800;
  const END_SCROLL_WAIT_COUNT = 12;
  const scrapedItems = new Set();
  const allProducts = [];

  async function smoothScrollAndScrapeAll() {
    let lastHeight = 0;
    let lastCount = 0;
    let sameCount = 0;

    while (sameCount < END_SCROLL_WAIT_COUNT) {
      window.scrollBy({ top: SCROLL_STEP, behavior: 'smooth' });
      await delay(SCROLL_DELAY);

      scrapeCurrentBatch();

      const newHeight = document.body.scrollHeight;
      const currentCount = allProducts.length;

      if (newHeight === lastHeight && currentCount === lastCount) {
        sameCount++;
      } else {
        sameCount = 0;
        lastHeight = newHeight;
        lastCount = currentCount;
      }
    }
  }

  function scrapeCurrentBatch() {
    document.querySelectorAll('ul.shopee-search-item-result__items > li.shopee-search-item-result__item').forEach(li => {
      const name = li.querySelector('div.line-clamp-2')?.innerText.trim();
      const priceWhole = li.querySelector('.text-base\\/5')?.innerText?.trim();
      const pricePrefix = li.querySelector('.text-xs\\/sp14.font-medium')?.innerText?.trim();
      const link = li.querySelector('a')?.href;

      if (name && link && !scrapedItems.has(link)) {
        scrapedItems.add(link);
        allProducts.push({
          Name: name,
          Price: `${pricePrefix || "Rp"} ${priceWhole || "N/A"}`,
          Link: link
        });
      }
    });

    console.log(`📦 Produk sementara terkumpul: ${allProducts.length}`);
  }

  function exportToXLSX(data, filename = 'shopee_products.xlsx') {
    if (!data || !data.length) {
      console.warn('Tidak ada data untuk diekspor.');
      return;
    }

    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Produk');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([wbout], { type: 'application/octet-stream' });
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

    console.log(`📥 File XLSX '${filename}' sudah didownload.`);
  }

  console.log("📜 Mulai scroll dan scraping produk Shopee...");
  await smoothScrollAndScrapeAll();

  console.log("✅ Scroll dan scraping selesai. Total produk ditemukan:", allProducts.length);
  console.table(allProducts);

  exportToXLSX(allProducts);
})();
