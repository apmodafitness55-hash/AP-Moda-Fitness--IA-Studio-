const https = require('https');

https.get('https://apmodafitness.com.br', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find all product names
    const nameRegex = /data-product-name="([^"]+)"/g;
    let match;
    const names = [];
    while ((match = nameRegex.exec(data)) !== null) {
      names.push(match[1]);
    }
    console.log('Product names found:', names);

    // Find all product hrefs
    const hrefRegex = /href="([^"]*\/produtos\/[^"]*)"/g;
    const hrefs = new Set();
    while ((match = hrefRegex.exec(data)) !== null) {
      hrefs.add(match[1]);
    }
    console.log('Product hrefs:', Array.from(hrefs));

    // Look for macacao hrefs or images
    const allMatches = data.match(/[^"'\s]*macac[^"'\s]*/gi) || [];
    console.log('Macacao mentions in HTML:', allMatches.slice(0, 20));
  });
}).on('error', err => console.error(err));
