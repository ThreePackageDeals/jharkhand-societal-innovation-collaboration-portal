async function test() {
  const base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  console.log('Sending request to http://localhost:3000/api/ai/verify-image...');
  const res = await fetch('http://localhost:3000/api/ai/verify-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Png,
      title: 'Water logging in Ranchi main road',
      description: 'Severe waterlogging and broken drains blocking traffic.',
      domain: 'urban_infrastructure',
      district: 'Ranchi',
    }),
  });
  console.log('HTTP Status:', res.status);
  const data = await res.json();
  console.log('Response Body:', JSON.stringify(data, null, 2));
}

test().catch(console.error);
