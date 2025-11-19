export default async function handler(req, res) {
  const { nick } = req.query;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!nick) {
    return res.json({ error: true, message: 'No nickname provided' });
  }

  try {
    const FACEIT_API_KEY = '227c9db1-b1b6-4b67-b7dc-0a5fc406ccb2';
    
    console.log('Fetching current match for:', nick);
    
    // 1. Получаем данные игрока
    const playerResponse = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nick}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`,
      }
    });

    if (!playerResponse.ok) {
      throw new Error('Player not found');
    }

    const playerData = await playerResponse.json();
    
    // 2. Получаем текущий матч
    const matchResponse = await fetch(`https://open.faceit.com/data/v4/players/${playerData.player_id}/current-match`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`,
      }
    });

    if (!matchResponse.ok) {
      // Если нет текущего матча
      return res.json({
        error: false,
        current: {
          present: false
        }
      });
    }

    const matchData = await matchResponse.json();
    console.log('Current match found:', matchData.match_id);
    
    // 3. Парсим данные матча
    const result = {
      error: false,
      current: {
        present: true,
        round: calculateCurrentRound(matchData),
        map: matchData.voting?.map?.pick?.[0] || 'Unknown',
        elo: calculateEloGain(matchData, playerData.player_id),
        duration: calculateMatchDuration(matchData),
        server: matchData.configured_server || 'Faceit Server',
        what: matchData.competition_name || 'Faceit Hub',
        match_id: matchData.match_id,
        status: matchData.status
      }
    };

    console.log('Match data:', result);
    return res.json(result);
    
  } catch (error) {
    console.error('API Error:', error.message);
    return res.json({
      error: true,
      message: error.message
    });
  }
}

// Вспомогательные функции
function calculateCurrentRound(matchData) {
  if (!matchData.rounds || matchData.rounds.length === 0) return '0';
  
  const finishedRounds = matchData.rounds.filter(round => round.round_stats && round.round_stats.Winner);
  return (finishedRounds.length + 1).toString();
}

function calculateEloGain(matchData, playerId) {
  // Faceit API не показывает точный gain/lose в реальном времени
  // Можно сделать приблизительный расчет или вернуть фиксированное значение
  return '+25/-25'; // Стандартные значения для Faceit
}

function calculateMatchDuration(matchData) {
  if (!matchData.started_at) return '0:00';
  
  const started = new Date(matchData.started_at * 1000);
  const now = new Date();
  const diffMs = now - started;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
