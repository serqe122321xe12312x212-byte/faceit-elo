export default async function handler(req, res) {
  const { nick } = req.query;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const FACEIT_API_KEY = '227c9db1-b1b6-4b67-b7dc-0a5fc406ccb2';
    
    // Получаем данные игрока
    const playerResponse = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nick}`, {
      headers: { 'Authorization': `Bearer ${FACEIT_API_KEY}` }
    });

    if (!playerResponse.ok) throw new Error('Player not found');
    const playerData = await playerResponse.json();
    
    // Проверяем текущий матч
    const matchResponse = await fetch(`https://open.faceit.com/data/v4/players/${playerData.player_id}/current-match`, {
      headers: { 'Authorization': `Bearer ${FACEIT_API_KEY}` }
    });

    if (!matchResponse.ok) {
      return res.json({ 
        error: false, 
        in_match: false,
        message: 'Not in match'
      });
    }

    const matchData = await matchResponse.json();
    
    // Получаем информацию о командах
    const teams = matchData.teams || {};
    const faction1 = teams.faction1 || {};
    const faction2 = teams.faction2 || {};
    
    // Считаем средний ELO
    const allPlayers = [
      ...(faction1.roster || []),
      ...(faction2.roster || [])
    ];
    
    let totalElo = 0;
    let playerCount = 0;
    const playerNames = [];
    
    for (const player of allPlayers) {
      if (player.games && player.games.cs2) {
        totalElo += player.games.cs2.faceit_elo;
        playerCount++;
        playerNames.push(player.nickname);
      }
    }
    
    const avgElo = playerCount > 0 ? Math.round(totalElo / playerCount) : 0;
    
    // Определяем карту
    const map = matchData.voting?.map?.pick?.[0] || 'Unknown';
    
    // Определяем где находится наш игрок
    const playerTeam = faction1.roster?.find(p => p.id === playerData.player_id) ? 'faction1' : 
                      faction2.roster?.find(p => p.id === playerData.player_id) ? 'faction2' : 'unknown';

    return res.json({
      error: false,
      in_match: true,
      map: map,
      avg_elo: avgElo,
      player_count: playerCount,
      players: playerNames,
      player_team: playerTeam,
      match_id: matchData.match_id
    });
    
  } catch (error) {
    return res.json({
      error: true,
      message: error.message
    });
  }
}
