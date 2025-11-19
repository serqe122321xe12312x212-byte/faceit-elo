export default async function handler(request, response) {
  const { nick } = request.query;
  
  if (!nick) {
    return response.json({ error: true, message: 'No nickname provided' });
  }

  try {
    // Парсим страницу Faceit для получения данных
    const html = await fetch(`https://www.faceit.com/ru/players/${nick}`).then(r => r.text());
    
    // Ищем данные в HTML
    const eloMatch = html.match(/"elo":(\d+)/);
    const levelMatch = html.match(/"skillLevel":(\d+)/);
    const nicknameMatch = html.match(/"nickname":"([^"]+)"/);

    if (eloMatch && levelMatch) {
      return response.json({
        error: false,
        nickname: nicknameMatch ? nicknameMatch[1] : nick,
        elo: eloMatch[1],
        level: levelMatch[1],
        lvl: levelMatch[1]
      });
    } else {
      // Альтернативный поиск
      const scriptMatch = html.match(/window\.__APOLLO_STATE__ = ({[^;]+})/);
      if (scriptMatch) {
        const data = JSON.parse(scriptMatch[1]);
        const playerKey = Object.keys(data).find(key => key.includes('Player'));
        if (playerKey && data[playerKey]) {
          return response.json({
            error: false,
            nickname: nick,
            elo: data[playerKey].games?.cs2?.faceitElo || 'N/A',
            level: data[playerKey].games?.cs2?.skillLevel || 'N/A',
            lvl: data[playerKey].games?.cs2?.skillLevel || 'N/A'
          });
        }
      }
      throw new Error('Player data not found');
    }
    
  } catch (error) {
    return response.json({
      error: true,
      message: 'Player not found or API error: ' + error.message
    });
  }
}