SELECT f.id, f.home_team, f.away_team, f.league_id, l.name as league_name
FROM api_fixtures f
LEFT JOIN leagues l ON f.league_id = l.id
WHERE f.api_fixture_id = 1382811;
