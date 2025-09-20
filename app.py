from flask import Flask, render_template, request, jsonify
from tinydb import TinyDB, Query
import os

app = Flask(__name__)

# --- Database Setup ---
if os.path.exists('db.json'):
    os.remove('db.json')  # Clear the database on each start for a fresh session
db = TinyDB('db.json')
votes_table = db.table('votes')
players_table = db.table('players')

# --- Game Data ---
games = [
    # Format: 'youtube_id' is the video ID from YouTube URL (e.g., 'XHVt2KkSIIU' from 'https://www.youtube.com/watch?v=XHVt2KkSIIU')
    # 7 Days to Die - Using official trailer from Fun Pimps
    {'id': 1, 'title': '7 Days to Die', 'url': 'https://store.steampowered.com/app/251570/7_Days_to_Die/', 'price': '$20.99', 'max_players': '8', 'youtube_id': 'Nl_9h2e-3fM'},
    {'id': 2, 'title': 'Age of Empires II: Definitive Edition', 'url': 'https://store.steampowered.com/app/813780/Age_of_Empires_II_Definitive_Edition/', 'price': '$34.99', 'max_players': '8', 'youtube_id': '1NhWgW7enMM'},
    {'id': 3, 'title': 'Age of Empires IV: Anniversary Edition', 'url': 'https://store.steampowered.com/app/1466860/Age_of_Empires_IV_Anniversary_Edition/', 'price': '$39.99', 'max_players': '8', 'youtube_id': 'O79KBkO5GtA'},
    {'id': 4, 'title': 'Among Us', 'url': 'https://store.steampowered.com/app/945360/Among_Us/', 'price': '$4.99', 'max_players': '15', 'youtube_id': 'NSJ4cESNQfE'},
    {'id': 5, 'title': 'ARK: Survival Ascended', 'url': 'https://store.steampowered.com/app/2399830/ARK_Survival_Ascended/', 'price': '$44.99', 'max_players': '70', 'youtube_id': '5fJI6XP0J2M'},
    {'id': 6, 'title': 'BallisticNG', 'url': 'https://store.steampowered.com/app/473770/BallisticNG/', 'price': '$14.99', 'max_players': '16', 'youtube_id': 'lz3f0J7tXK4'},
    {'id': 7, 'title': 'Ball Race Party', 'url': 'https://store.steampowered.com/app/3202400/Ball_Race_Party/', 'price': '$3.99', 'max_players': '12', 'youtube_id': 'mQY3Z9v7Lq4'},
    {'id': 8, 'title': 'Besiege', 'url': 'https://store.steampowered.com/app/346010/Besiege/', 'price': '$3.74', 'max_players': '8', 'youtube_id': 'g7Vh2h6xqa0'},
    {'id': 9, 'title': 'Blackwake', 'url': 'https://store.steampowered.com/app/420290/Blackwake/', 'price': 'FREE', 'max_players': '13 Player Crew', 'youtube_id': 'JNq8wFnMA7w'},
    {'id': 10, 'title': 'Circuit Superstars', 'url': 'https://store.steampowered.com/app/1097130/Circuit_Superstars/', 'price': '$19.99', 'max_players': '12', 'youtube_id': 'VjZ7tU4hU9s'},
    {'id': 11, 'title': 'Command & Conquer Remastered', 'url': 'https://store.steampowered.com/app/1213210/Command__Conquer_Remastered_Collection/', 'price': '$4.99', 'max_players': '4 / 8', 'youtube_id': 'OarRYpma1h4'},
    {'id': 12, 'title': 'Counter-Strike', 'url': 'https://store.steampowered.com/app/10/CounterStrike/', 'price': '$9.99', 'max_players': '10 / 32', 'youtube_id': 'edYCtaNSc3g'},
    {'id': 13, 'title': 'Counter-Strike 2', 'url': 'https://store.steampowered.com/app/730/CounterStrike_2/', 'price': 'FREE', 'max_players': '10 / 64', 'youtube_id': 'RzZ2bWZ_8Ho'},
    {'id': 14, 'title': 'DayZ', 'url': 'https://store.steampowered.com/app/221100/DayZ/', 'price': '$29.99', 'max_players': '60', 'youtube_id': 'XIWyk2mz5ug'},
    {'id': 15, 'title': 'Due Process', 'url': 'https://store.steampowered.com/app/753650/Due_Process/', 'price': '$0.99', 'max_players': '10', 'youtube_id': 'XlZR0GQnR1k'},
    {'id': 16, 'title': 'EmptyEpsilon', 'url': 'https://store.steampowered.com/app/1907040/EmptyEpsilon/', 'price': 'FREE', 'max_players': '32', 'youtube_id': 'tMnXqY4ZQo8'},
    {'id': 17, 'title': 'Fistful of Frags', 'url': 'https://store.steampowered.com/app/265630/Fistful_of_Frags/', 'price': 'FREE', 'max_players': '20', 'youtube_id': 'zQY3qKh6vRg'},
    {'id': 18, 'title': 'GoldenEye: Source', 'url': 'https://www.moddb.com/mods/goldeneye-source', 'price': 'FREE', 'max_players': '16', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 19, 'title': 'Guild Wars 2', 'url': 'https://store.steampowered.com/app/1284210/Guild_Wars_2/', 'price': 'FREE', 'max_players': 'N/A', 'youtube_id': 'oR9XaU9M5t8'},
    {'id': 20, 'title': 'Halo: The Master Chief Collection', 'url': 'https://store.steampowered.com/app/976730/Halo_The_Master_Chief_Collection/', 'price': '$39.99', 'max_players': '16', 'youtube_id': '8r8CNWfUQvo'},
    {'id': 21, 'title': 'Heroes of the Storm', 'url': 'https://heroesofthestorm.blizzard.com/en-us/', 'price': 'FREE', 'max_players': '10', 'youtube_id': '0ecv0bT9DEo'},
    {'id': 22, 'title': 'HYPERCHARGE: Unboxed', 'url': 'https://store.steampowered.com/app/523660/HYPERCHARGE_Unboxed/', 'price': '$24.99', 'max_players': '8', 'youtube_id': 'eLdi9aINqXk'},
    {'id': 23, 'title': 'Marvel Rivals', 'url': 'https://store.steampowered.com/app/2767030/Marvel_Rivals/', 'price': 'FREE', 'max_players': '12', 'youtube_id': 'jSP4KPf2D4M'},
    {'id': 24, 'title': 'NEOTOKYO', 'url': 'https://store.steampowered.com/app/244630/NEOTOKYO/', 'price': 'FREE', 'max_players': '32', 'youtube_id': '4c7aZ6lzw7o'},
    {'id': 25, 'title': 'Nuclear Nightmare', 'url': 'https://store.steampowered.com/app/2909110/Nuclear_Nightmare/', 'price': '$6.99', 'max_players': '8', 'youtube_id': 'vXqWZ8QkUQk'},
    {'id': 26, 'title': 'Overwatch 2', 'url': 'https://store.steampowered.com/app/2357570/Overwatch_2/', 'price': 'FREE', 'max_players': '12', 'youtube_id': 'GKXS_YA9s7E'},
    {'id': 27, 'title': 'Overload', 'url': 'https://store.steampowered.com/app/448850/Overload/', 'price': '$29.99', 'max_players': '8', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 28, 'title': 'PICO PARK 2', 'url': 'https://store.steampowered.com/app/2644470/PICO_PARK_2/', 'price': 'FREE', 'max_players': '8', 'youtube_id': '8QjDm0fFKy4'},
    {'id': 29, 'title': 'Pummel Party', 'url': 'https://store.steampowered.com/app/880940/Pummel_Party/', 'price': '$14.99', 'max_players': '8', 'youtube_id': '9Kp8LbGJ8sQ'},
    {'id': 30, 'title': 'Renegade X', 'url': 'https://totemarts.games/games/renegade-x/', 'price': 'FREE', 'max_players': '64', 'youtube_id': 'h2X9F8Y6f7E'},
    {'id': 31, 'title': 'Retrocycles', 'url': 'https://store.steampowered.com/app/1306180/Retrocycles/', 'price': 'FREE', 'max_players': '16', 'youtube_id': '5XgB5XgB5Xg'},
    {'id': 32, 'title': 'Rust', 'url': 'https://store.steampowered.com/app/252490/Rust/', 'price': '$39.99', 'max_players': '1024', 'youtube_id': 'MJV4fsUKfSk'},
    {'id': 33, 'title': 'Sea of Thieves', 'url': 'https://store.steampowered.com/app/1172620/Sea_of_Thieves_2025_Edition/', 'price': '$39.99', 'max_players': '4 Player Crew', 'youtube_id': 'r5JIBaETE8I'},
    {'id': 34, 'title': 'Serious Sam HD', 'url': 'https://store.steampowered.com/app/41000/Serious_Sam_HD_The_First_Encounter/', 'price': '$1.49', 'max_players': '16', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 35, 'title': 'Soldat 2', 'url': 'https://store.steampowered.com/app/474220/Soldat_2/', 'price': '$7.99', 'max_players': '32', 'youtube_id': '5XgB5XgB5Xg'},
    {'id': 36, 'title': 'StarCraft', 'url': 'https://starcraft.blizzard.com/en-us/', 'price': 'FREE', 'max_players': '8 / 12', 'youtube_id': 'VTLcAKAzSbM'},
    {'id': 37, 'title': 'StarCraft 2', 'url': 'https://starcraft2.blizzard.com/en-us/', 'price': 'FREE', 'max_players': '8 / 12', 'youtube_id': '9SfCDk5PStM'},
    {'id': 38, 'title': 'Stumble Guys', 'url': 'https://store.steampowered.com/app/1677740/Stumble_Guys/', 'price': 'FREE', 'max_players': '32', 'youtube_id': 'DGBGgH5jfXc'},
    {'id': 39, 'title': 'Sven Co-op', 'url': 'https://store.steampowered.com/app/225840/Sven_Coop/', 'price': 'FREE', 'max_players': '32', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 40, 'title': 'Texas Chain Saw Massacre', 'url': 'https://store.steampowered.com/app/1433140/The_Texas_Chain_Saw_Massacre/', 'price': '$19.99', 'max_players': '7', 'youtube_id': 'yXfDwgW4H4E'},
    {'id': 41, 'title': 'Torchlight II', 'url': 'https://store.steampowered.com/app/200710/Torchlight_II/', 'price': '$19.99', 'max_players': '8', 'youtube_id': '8ZbFHCW6e2M'},
    {'id': 42, 'title': 'TRIBES 3: Rivals', 'url': 'https://store.steampowered.com/app/2687970/TRIBES_3_Rivals/', 'price': '$19.99', 'max_players': '32', 'youtube_id': 'h2X9F8Y6f7E'},
    {'id': 43, 'title': 'V Rising', 'url': 'https://store.steampowered.com/app/1604030/V_Rising/', 'price': '$34.99', 'max_players': '60', 'youtube_id': 'aGBZL3pQ9vI'},
    {'id': 44, 'title': 'Viscera Cleanup Detail', 'url': 'https://store.steampowered.com/app/246900/Viscera_Cleanup_Detail/', 'price': '$12.99 or $34.99 for 4-Pack', 'max_players': '32', 'youtube_id': 'N9pX3yPdd0c'},
    {'id': 45, 'title': 'Warborne Above Ashes', 'url': 'https://store.steampowered.com/app/3142050/Warborne_Above_Ashes/', 'price': 'FREE', 'max_players': '200', 'youtube_id': '5XgB5XgB5Xg'},
    {'id': 46, 'title': 'Warcraft III: Reforged', 'url': 'https://warcraft3.blizzard.com/en-us/', 'price': '$29.99', 'max_players': '24', 'youtube_id': '1m7L9uLzR5g'},
    {'id': 47, 'title': 'X-MODE', 'url': 'https://store.steampowered.com/app/2265640/XMODE/', 'price': 'FREE', 'max_players': 'N/A', 'youtube_id': '5XgB5XgB5Xg'}
]

@app.route('/')
def index():
    return render_template('index.html', games=games)

@app.route('/vote', methods=['POST'])
def vote():
    player_id = len(players_table.all()) + 1
    players_table.insert({'player_id': player_id})

    for game in games:
        game_id = str(game['id'])
        vote_status = request.form.get(str(game_id), '').strip()
        # Only record the vote if a selection was made (not empty string)
        if vote_status:
            votes_table.insert({'player_id': player_id, 'game_id': game_id, 'vote': vote_status})
    
    return jsonify({'success': True, 'message': 'Vote recorded successfully!'})

@app.route('/results')
def results_page():
    return render_template('results.html')

@app.route('/api/results')
def api_results():
    results = {}
    for game in games:
        game_id = str(game['id'])
        Vote = Query()
        interested_votes = votes_table.count((Vote.game_id == game_id) & (Vote.vote == 'interested'))
        not_interested_votes = votes_table.count((Vote.game_id == game_id) & (Vote.vote == 'not-interested'))
        maybe_votes = votes_table.count((Vote.game_id == game_id) & (Vote.vote == 'maybe'))
        results[game['title']] = {
            'interested': interested_votes,
            'not_interested': not_interested_votes,
            'maybe': maybe_votes
        }

    # Sort for top 10 lists
    sorted_interested = sorted(results.items(), key=lambda item: item[1]['interested'], reverse=True)
    sorted_maybe = sorted(results.items(), key=lambda item: item[1]['maybe'], reverse=True)

    top_10_interested = [{'title': game, 'votes': data['interested']} for game, data in sorted_interested[:10]]
    top_10_maybe = [{'title': game, 'votes': data['maybe']} for game, data in sorted_maybe[:10]]

    return jsonify({
        'results': results,
        'top_10_interested': top_10_interested,
        'top_10_maybe': top_10_maybe
    })

if __name__ == '__main__':
    app.run(debug=True)
