export default async function handler(req, res) {
  const { nick } = req.query;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!nick) {
    return res.json({ error: true, message: 'No nickname provided' });
  }

  try {
    const FACEIT_API_KEY = '227c9db1-b1b6-4b67-b7dc-0a5fc406ccb2';
    
    console.log('Fetching Faceit data for:', nick);
    
    // Получаем основные данные игрока
    const playerResponse = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nick}`, {
      headers: {
        'Authorization': `Bearer ${FACEIT_API_KEY}`,
      }
    });

    if (!playerResponse.ok) {
      throw new Error('Player not found');
    }

    const playerData = await playerResponse.json();
    console.log('Player data received');
    
    // Извлекаем CS2 данные из основной информации
    const cs2Data = playerData.games?.cs2;
    
    if (!cs2Data) {
      // Если нет CS2, пробуем CSGO
      const csgoData = playerData.games?.csgo;
      if (csgoData) {
        console.log('Using CS:GO data');
        const result = {
          error: false,
          nickname: playerData.nickname,
          elo: csgoData.faceit_elo || 'N/A',
          level: csgoData.skill_level || 'N/A',
          lvl: csgoData.skill_level || 'N/A',
          game: 'csgo'
        };
        return res.json(result);
      } else {
        throw new Error('No CS2 or CS:GO data found');
      }
    }

    // Формируем успешный ответ
    const result = {
      error: false,
      nickname: playerData.nickname,
      elo: cs2Data.faceit_elo,
      level: cs2Data.skill_level,
      lvl: cs2Data.skill_level,
      game: 'cs2'
    };

    console.log('Success:', result);
    return res.json(result);
    
  } catch (error) {
    console.error('API Error:', error.message);
    return res.json({
      error: true,
      message: error.message
    });
  }
}
