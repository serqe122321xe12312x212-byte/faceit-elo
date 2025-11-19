export default async function handler(req, res) {
  const { nick } = req.query;
  
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!nick) {
    return res.json({ error: true, message: 'No nickname provided' });
  }

  try {
    const FACEIT_API_KEY = '227c9db1-b1b6-4b67-b7dc-0a5fc406ccb2';
    
    // 1. Получаем данные игрока
    const playerResponse = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nick}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!playerResponse.ok) {
      throw new Error('Player not found');
    }

    const playerData = await playerResponse.json();
    
    // 2. Получаем CS2 статистику
    const statsResponse = await fetch(`https://open.faceit.com/data/v4/players/${playerData.player_id}/games/cs2`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      throw new Error('CS2 stats not found');
    }

    const statsData = await statsResponse.json();

    // 3. Формируем ответ
    const result = {
      error: false,
      nickname: playerData.nickname,
      player_id: playerData.player_id,
      elo: statsData.faceit_elo,
      level: statsData.skill_level,
      lvl: statsData.skill_level,
      stats: {
        lifetime: {
          Wins: statsData.lifetime?.Wins || 0,
          Matches: statsData.lifetime?.Matches || 0,
          'Win Rate %': statsData.lifetime?.['Win Rate %'] || 0
        }
      }
    };

    return res.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.json({
      error: true,
      message: error.message || 'Unknown error'
    });
  }
}
