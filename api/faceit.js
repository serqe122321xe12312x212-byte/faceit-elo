export default async function handler(req, res) {
  const { nick } = req.query;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!nick) {
    return res.json({ error: true, message: 'No nickname provided' });
  }

  try {
    const FACEIT_API_KEY = '227c9db1-b1b6-4b67-b7dc-0a5fc406ccb2';
    
    console.log('Fetching data for:', nick);
    
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
    console.log('Player found:', playerData.nickname);
    
    // 2. Получаем статистику по играм
    const statsResponse = await fetch(`https://open.faceit.com/data/v4/players/${playerData.player_id}/games`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`,
      }
    });

    if (!statsResponse.ok) {
      throw new Error('Games stats not found');
    }

    const gamesData = await statsResponse.json();
    console.log('Available games:', Object.keys(gamesData));
    
    // 3. Ищем CS2 или CS:GO статистику
    let cs2Data = gamesData.cs2; // Пробуем CS2
    
    if (!cs2Data) {
      cs2Data = gamesData.csgo; // Если нет CS2, пробуем CS:GO
      console.log('Using CS:GO data instead of CS2');
    }
    
    if (!cs2Data) {
      // Если вообще нет статистики по Counter-Strike
      const result = {
        error: false,
        nickname: playerData.nickname,
        player_id: playerData.player_id,
        elo: playerData.games?.cs2?.faceit_elo || playerData.games?.csgo?.faceit_elo || 'N/A',
        level: playerData.games?.cs2?.skill_level || playerData.games?.csgo?.skill_level || 'N/A',
        lvl: playerData.games?.cs2?.skill_level || playerData.games?.csgo?.skill_level || 'N/A',
        message: 'No detailed CS2 stats available'
      };
      return res.json(result);
    }

    // 4. Формируем ответ
    const result = {
      error: false,
      nickname: playerData.nickname,
      player_id: playerData.player_id,
      elo: cs2Data.faceit_elo,
      level: cs2Data.skill_level,
      lvl: cs2Data.skill_level,
      stats: {
        lifetime: {
          Wins: cs2Data.lifetime?.Wins || 0,
          Matches: cs2Data.lifetime?.Matches || 0,
          'Win Rate %': cs2Data.lifetime?.['Win Rate %'] || 0,
          'Average K/D Ratio': cs2Data.lifetime?.['Average K/D Ratio'] || 0
        }
      }
    };

    console.log('Success:', result);
    return res.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.json({
      error: true,
      message: error.message || 'Unknown error'
    });
  }
}
