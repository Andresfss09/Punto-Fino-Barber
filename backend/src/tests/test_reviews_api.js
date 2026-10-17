async function testReviewsAPI() {
  // 1. GET reviews
  const res1 = await fetch('http://localhost:5000/api/reviews');
  const json1 = await res1.json();
  console.log('GET /api/reviews status:', res1.status, json1);

  // 2. POST review
  const res2 = await fetch('http://localhost:5000/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Andrés Felipe Sarria Sabogal',
      email: 'andressarriasabogal@gmail.com',
      rating: 5,
      comment: 'Excelente atención de Emanuel y Juan Diego. La puntualidad y el corte impecable como siempre.',
      serviceName: 'Experiencia Punto Fino (Corte + Cejas)'
    })
  });
  const json2 = await res2.json();
  console.log('POST /api/reviews status:', res2.status, json2);

  // 3. GET reviews again
  const res3 = await fetch('http://localhost:5000/api/reviews');
  const json3 = await res3.json();
  console.log('GET /api/reviews count:', json3.data?.count, 'average:', json3.data?.averageRating);
}

testReviewsAPI().catch(console.error);

