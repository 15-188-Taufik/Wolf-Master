const fetch = require('node-fetch');

async function testCreateGame() {
  try {
    const response = await fetch('http://localhost:3000/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        players: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
        name: 'Test Game'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateGame();
