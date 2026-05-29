const https = require('https');

https.get('https://envolvematogrosso.com.br/assets/index-yz2rEf0P.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY PREVIEW (first 500 chars):');
    console.log(data.slice(0, 500));
  });
}).on('error', (err) => {
  console.error('Error fetching JS:', err.message);
});
