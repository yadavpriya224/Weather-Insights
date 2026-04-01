import https from 'https';

https.get('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&start_date=2026-04-10&end_date=2026-04-10&hourly=temperature_2m&timezone=auto', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
