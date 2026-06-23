const puppeteer = require('puppeteer');
const fs = require('fs');


(async () => {

  // Launch the browser
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security' // Temporarily disable web security to avoid CORS issues that headless bots sometimes get
    ]
  });
  const page = await browser.newPage();
  
  // Set a standard user agent to avoid bot detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  // Forward console messages from the browser to the terminal
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('slides to process') || text.includes('Clicking slide') || text.includes('Scraping Complete')) {
      console.log('Browser Console:', text);
    }
  });

  const url = 'https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/statistics/team-statistics';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Handle Cookie Popup
  try {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const rejectButton = buttons.find(b => b.textContent.includes('Rejeitar todos') || b.textContent.includes('Concordo'));
      if (rejectButton) {
        rejectButton.click();
      }
    });
    console.log("Clicked cookie banner button.");
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log("No cookie banner found or could not click.");
  }

  // Wait for the elements to load to make sure the script runs smoothly
  try {
    await page.waitForSelector('.swiper-slide', { timeout: 10000 });
  } catch (error) {
    console.log("Warning: Could not find .swiper-slide elements within 10 seconds. Proceeding anyway...");
  }
  
  // Try waiting for the actual table to render (the spinner to go away)
  try {
    await page.waitForSelector('table', { timeout: 10000 });
    console.log("Found table element!");
  } catch (error) {
    console.log("Warning: Could not find 'table' element within 10 seconds. The page might still be loading or CORS blocked the data.");
  }

  console.log('Executing user extraction logic...');
  const allResults = await page.evaluate(async () => {
     const indexToText = {
      0 : "Ataque",
      1: "Distribuição",
      2: "Defesa"
    }
    // 1. Modulate the extraction logic into a reusable function
    function extractTableData() {
      const table = document.querySelector('table');
      const extractedData = [];

      if (table) {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        
        const tbodyRows = table.querySelectorAll('tbody tr');
        const rows = tbodyRows.length > 0 
          ? tbodyRows 
          : Array.from(table.querySelectorAll('tr')).slice(1);

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const rowObject = {};
            cells.forEach((cell, index) => {
              const key = headers[index] || `column_${index}`;
              rowObject[key] = cell.textContent.trim();
            });
            extractedData.push(rowObject);
          }
        });
      }
      return extractedData;
    }

    // 2. Create a helper function to pause the script (sleep)
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 3. Create the main asynchronous loop
    async function scrapeAllSlides() {
      const slides = document.querySelectorAll('.swiper-slide');
      const allResults = [];

      console.log(`Found ${slides.length} slides to process. Starting...`);

      for (let i = 0; i < 3; i++) {
        const slide = slides[i];
        const clickableElement = slide.children[0];

        if (clickableElement) {
          console.log(`Clicking slide ${i + 1} of ${slides.length}...`);
          
          clickableElement.click();

          // Wait 3 seconds to be safe (since it was spinning before)
          await wait(3000); 

          const currentTableData = extractTableData();

          allResults.push({
            slideIndex: i,
            tableTitle: indexToText[i],
            data: currentTableData
          });
        }
      }

      console.log('✅ Scraping Complete!');
      return allResults;
    }

    return await scrapeAllSlides();
  });

  const outputPath = 'fifa-team-statistics.json';
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n✅ Data successfully saved to "${outputPath}"!`);
  
  const extractedCount = allResults.filter(r => r.data && r.data.length > 0).length;
  console.log(`Extracted data for ${extractedCount} out of ${allResults.length} slides.`);

  await browser.close();
})();
