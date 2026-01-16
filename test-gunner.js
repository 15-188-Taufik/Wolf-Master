async function testGunner() {
  try {
    // Step 1: Create a game
    console.log('🎮 Creating test game...');
    const gameRes = await fetch('http://localhost:3000/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        players: ['Gunner Player', 'Target Player', 'Victim1', 'Victim2', 'Victim3'],
        name: 'Gunner Test'
      })
    });

    const gameData = await gameRes.json();
    if (!gameData.id) {
      console.error('Failed to create game:', gameData);
      return;
    }

    const gameId = gameData.id;
    console.log(`✅ Game created: ${gameId}`);

    // Step 2: Assign roles
    console.log('\n🎯 Assigning roles...');
    const rolesRes = await fetch(`http://localhost:3000/api/game/${gameId}/assign-roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roles: ['gunner', 'villager', 'villager', 'villager', 'werewolf']
      })
    });

    const rolesData = await rolesRes.json();
    if (rolesRes.ok) {
      console.log('✅ Roles assigned');
      console.log('Players and roles:', rolesData.players.map(p => ({ nickname: p.nickname, role: p.roleId })));
    } else {
      console.error('Failed to assign roles:', rolesData);
      return;
    }

    // Step 3: Test resolve with gunner action
    console.log('\n🔫 Testing gunner action...');
    
    // Get player IDs
    const gunnerPlayerId = rolesData.players.find(p => p.roleId === 'gunner')?.id;
    const targetPlayerId = rolesData.players.find(p => p.roleId === 'villager')?.id;
    const werewolfId = rolesData.players.find(p => p.roleId === 'werewolf')?.id;

    console.log(`Gunner: ${gunnerPlayerId}`);
    console.log(`Target: ${targetPlayerId}`);
    console.log(`Werewolf: ${werewolfId}`);

    if (!gunnerPlayerId || !targetPlayerId) {
      console.error('Missing gunner or target player');
      return;
    }

    // Call resolve with gunner action
    const resolveRes = await fetch(`http://localhost:3000/api/game/${gameId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actions: {
          [gunnerPlayerId]: targetPlayerId, // Gunner shoots target
          [werewolfId]: targetPlayerId // Werewolf also hunts target
        }
      })
    });

    const resolveData = await resolveRes.json();
    console.log('\n📊 Resolve response:');
    console.log('Deaths:', resolveData.deaths);
    console.log('Reports:', resolveData.reports);
    console.log('Is game over:', resolveData.isGameOver);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGunner();
