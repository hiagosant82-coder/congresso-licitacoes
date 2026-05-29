const https = require('https');

https.get('https://envolvematogrosso.com.br/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY LENGTH:', data.length);
    console.log('BODY PREVIEW:');
    console.log(data.slice(0, 1500));
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
