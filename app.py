from flask import Flask, render_template, request, jsonify, redirect, url_for
from tinydb import TinyDB, Query
import os
from datetime import datetime
import requests

app = Flask(__name__)

# --- Database Setup ---
# Keep DB persistent across restarts; do not clear on startup
# Allow overriding DB path via environment variable for persistent disks in production
DB_PATH = os.environ.get('DB_PATH', 'db.json')
try:
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
except Exception:
    # If we cannot create the directory, TinyDB will likely fail later; but avoid crashing on import
    pass
db = TinyDB(DB_PATH)
votes_table = db.table('votes')
users_table = db.table('users')  # Track users and their submissions
submitted_games_table = db.table('submitted_games')

# --- Game Data ---
games = [
    # Format: 'steam_app_id' is extracted from Steam URL, 'youtube_id' is optional backup
    {'id': 1, 'title': '7 Days to Die', 'url': 'https://store.steampowered.com/app/251570/7_Days_to_Die/', 'price': '$20.99', 'max_players': '8', 'steam_app_id': '251570', 'youtube_id': 'LbpXoMZWnQY'},
    {'id': 2, 'title': 'Age of Empires II: Definitive Edition', 'url': 'https://store.steampowered.com/app/813780/Age_of_Empires_II_Definitive_Edition/', 'price': '$34.99', 'max_players': '8', 'steam_app_id': '813780', 'youtube_id': 'RYwZ6GZXWhA'},
    {'id': 3, 'title': 'Age of Empires IV: Anniversary Edition', 'url': 'https://store.steampowered.com/app/1466860/Age_of_Empires_IV_Anniversary_Edition/', 'price': '$39.99', 'max_players': '8', 'steam_app_id': '1466860', 'youtube_id': 'JjWOvoKmWpE'},
    {'id': 4, 'title': 'Among Us', 'url': 'https://store.steampowered.com/app/945360/Among_Us/', 'price': '$4.99', 'max_players': '15', 'steam_app_id': '945360', 'youtube_id': 'NSJ4cESNQfE'},
    {'id': 5, 'title': 'ARK: Survival Ascended', 'url': 'https://store.steampowered.com/app/2399830/ARK_Survival_Ascended/', 'price': '$44.99', 'max_players': '70', 'steam_app_id': '2399830', 'youtube_id': 'sKSk5qp5hzs'},
    {'id': 6, 'title': 'BallisticNG', 'url': 'https://store.steampowered.com/app/473770/BallisticNG/', 'price': '$14.99', 'max_players': '16', 'steam_app_id': '473770', 'youtube_id': 'lz3f0J7tXK4'},
    {'id': 7, 'title': 'Ball Race Party', 'url': 'https://store.steampowered.com/app/3202400/Ball_Race_Party/', 'price': '$3.99', 'max_players': '12', 'steam_app_id': '3202400', 'youtube_id': 'mQY3Z9v7Lq4'},
    {'id': 8, 'title': 'Besiege', 'url': 'https://store.steampowered.com/app/346010/Besiege/', 'price': '$3.74', 'max_players': '8', 'steam_app_id': '346010', 'youtube_id': 'g7Vh2h6xqa0'},
    {'id': 9, 'title': 'Blackwake', 'url': 'https://store.steampowered.com/app/420290/Blackwake/', 'price': 'FREE', 'max_players': 'Crews up to 13', 'steam_app_id': '420290', 'youtube_id': 'JNq8wFnMA7w'},
    {'id': 10, 'title': 'Circuit Superstars', 'url': 'https://store.steampowered.com/app/1097130/Circuit_Superstars/', 'price': '$19.99', 'max_players': '12', 'steam_app_id': '1097130', 'youtube_id': 'VjZ7tU4hU9s'},
    {'id': 11, 'title': 'Command & Conquer Remastered', 'url': 'https://store.steampowered.com/app/1213210/Command__Conquer_Remastered_Collection/', 'price': '$4.99', 'max_players': '4 / 8', 'steam_app_id': '1213210', 'youtube_id': 'OarRYpma1h4'},
    {'id': 12, 'title': 'Counter-Strike', 'url': 'https://store.steampowered.com/app/10/CounterStrike/', 'price': '$9.99', 'max_players': '10 / 32', 'steam_app_id': '10', 'youtube_id': 'edYCtaNSc3g'},
    {'id': 13, 'title': 'Counter-Strike 2', 'url': 'https://store.steampowered.com/app/730/CounterStrike_2/', 'price': 'FREE', 'max_players': '10 / 64', 'steam_app_id': '730', 'youtube_id': 'RzZ2bWZ_8Ho'},
    {'id': 14, 'title': 'DayZ', 'url': 'https://store.steampowered.com/app/221100/DayZ/', 'price': '$29.99', 'max_players': '60', 'steam_app_id': '221100', 'youtube_id': 'XIWyk2mz5ug'},
    {'id': 15, 'title': 'Due Process', 'url': 'https://store.steampowered.com/app/753650/Due_Process/', 'price': '$0.99', 'max_players': '10', 'steam_app_id': '753650', 'youtube_id': 'XlZR0GQnR1k'},
    {'id': 16, 'title': 'Dune: Awakening', 'url': 'https://store.steampowered.com/app/1172710/Dune_Awakening/', 'price': '$29.99', 'max_players': 'N/A', 'steam_app_id': '1172710'},
    {'id': 17, 'title': 'EmptyEpsilon', 'url': 'https://store.steampowered.com/app/1907040/EmptyEpsilon/', 'price': 'FREE', 'max_players': '32', 'steam_app_id': '1907040', 'youtube_id': 'tMnXqY4ZQo8'},
    {'id': 18, 'title': 'Fistful of Frags', 'url': 'https://store.steampowered.com/app/265630/Fistful_of_Frags/', 'price': 'FREE', 'max_players': '20', 'steam_app_id': '265630', 'youtube_id': 'zQY3qKh6vRg'},
    {'id': 19, 'title': 'GoldenEye: Source', 'url': 'https://www.moddb.com/mods/goldeneye-source', 'price': 'FREE', 'max_players': '16', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 20, 'title': 'Guild Wars 2', 'url': 'https://store.steampowered.com/app/1284210/Guild_Wars_2/', 'price': 'FREE', 'max_players': 'N/A', 'steam_app_id': '1284210', 'youtube_id': 'oR9XaU9M5t8'},
    {'id': 21, 'title': 'Halo: The Master Chief Collection', 'url': 'https://store.steampowered.com/app/976730/Halo_The_Master_Chief_Collection/', 'price': '$39.99', 'max_players': '16', 'steam_app_id': '976730', 'youtube_id': '8r8CNWfUQvo'},
    {'id': 22, 'title': 'Heroes of the Storm', 'url': 'https://heroesofthestorm.blizzard.com/en-us/', 'price': 'FREE', 'max_players': '10', 'youtube_id': '0ecv0bT9DEo'},
    {'id': 23, 'title': 'HYPERCHARGE: Unboxed', 'url': 'https://store.steampowered.com/app/523660/HYPERCHARGE_Unboxed/', 'price': '$24.99', 'max_players': '8', 'steam_app_id': '523660', 'youtube_id': 'eLdi9aINqXk'},
    {'id': 24, 'title': 'Marvel Rivals', 'url': 'https://store.steampowered.com/app/2767030/Marvel_Rivals/', 'price': 'FREE', 'max_players': '12', 'steam_app_id': '2767030', 'youtube_id': 'jSP4KPf2D4M'},
    {'id': 25, 'title': 'NEOTOKYO', 'url': 'https://store.steampowered.com/app/244630/NEOTOKYO/', 'price': 'FREE', 'max_players': '32', 'steam_app_id': '244630', 'youtube_id': '4c7aZ6lzw7o'},
    {'id': 26, 'title': 'Nuclear Nightmare', 'url': 'https://store.steampowered.com/app/2909110/Nuclear_Nightmare/', 'price': '$6.99', 'max_players': '8', 'steam_app_id': '2909110', 'youtube_id': 'vXqWZ8QkUQk'},
    {'id': 27, 'title': 'Overwatch 2', 'url': 'https://store.steampowered.com/app/2357570/Overwatch_2/', 'price': 'FREE', 'max_players': '12', 'steam_app_id': '2357570', 'youtube_id': 'GKXS_YA9s7E'},
    {'id': 28, 'title': 'Overload', 'url': 'https://store.steampowered.com/app/448850/Overload/', 'price': '$29.99', 'max_players': '8', 'steam_app_id': '448850', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 29, 'title': 'PICO PARK 2', 'url': 'https://store.steampowered.com/app/2644470/PICO_PARK_2/', 'price': '$4.99', 'max_players': '8', 'steam_app_id': '2644470', 'youtube_id': '8QjDm0fFKy4'},
    {'id': 30, 'title': 'Pummel Party', 'url': 'https://store.steampowered.com/app/880940/Pummel_Party/', 'price': '$14.99', 'max_players': '8', 'steam_app_id': '880940', 'youtube_id': '9Kp8LbGJ8sQ'},
    {'id': 31, 'title': 'Renegade X', 'url': 'https://totemarts.games/games/renegade-x/', 'price': 'FREE', 'max_players': '64', 'youtube_id': 'h2X9F8Y6f7E'},
    {'id': 32, 'title': 'Retrocycles', 'url': 'https://store.steampowered.com/app/1306180/Retrocycles/', 'price': 'FREE', 'max_players': '16', 'steam_app_id': '1306180', 'youtube_id': '5XgB5XgB5Xg'},
    {'id': 33, 'title': 'Rust', 'url': 'https://store.steampowered.com/app/252490/Rust/', 'price': '$39.99', 'max_players': '1024', 'steam_app_id': '252490', 'youtube_id': 'MJV4fsUKfSk'},
    {'id': 34, 'title': 'Sea of Thieves', 'url': 'https://store.steampowered.com/app/1172620/Sea_of_Thieves_2025_Edition/', 'price': '$39.99', 'max_players': 'Crews up to 4', 'steam_app_id': '1172620', 'youtube_id': 'r5JIBaETE8I'},
    {'id': 35, 'title': 'Serious Sam HD', 'url': 'https://store.steampowered.com/app/41000/Serious_Sam_HD_The_First_Encounter/', 'price': '$1.49', 'max_players': '16', 'steam_app_id': '41000', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 36, 'title': 'Soldat 2', 'url': 'https://store.steampowered.com/app/474220/Soldat_2/', 'price': '$7.99', 'max_players': '32', 'steam_app_id': '474220', 'youtube_id': '5XgB5XgB5Xg'},
    {'id': 37, 'title': 'StarCraft', 'url': 'https://starcraft.blizzard.com/en-us/', 'price': 'FREE', 'max_players': '8 / 12', 'youtube_id': 'VTLcAKAzSbM'},
    {'id': 38, 'title': 'StarCraft 2', 'url': 'https://starcraft2.blizzard.com/en-us/', 'price': 'FREE', 'max_players': '8 / 12', 'youtube_id': '9SfCDk5PStM'},
    {'id': 39, 'title': 'Stumble Guys', 'url': 'https://store.steampowered.com/app/1677740/Stumble_Guys/', 'price': 'FREE', 'max_players': '32', 'steam_app_id': '1677740', 'youtube_id': 'DGBGgH5jfXc'},
    {'id': 40, 'title': 'Sven Co-op', 'url': 'https://store.steampowered.com/app/225840/Sven_Coop/', 'price': 'FREE', 'max_players': '32', 'steam_app_id': '225840', 'youtube_id': '3f0zVRcMZJc'},
    {'id': 41, 'title': 'Texas Chain Saw Massacre', 'url': 'https://store.steampowered.com/app/1433140/The_Texas_Chain_Saw_Massacre/', 'price': '$19.99', 'max_players': '7', 'steam_app_id': '1433140', 'youtube_id': 'yXfDwgW4H4E'},
    {'id': 42, 'title': 'Torchlight II', 'url': 'https://store.steampowered.com/app/200710/Torchlight_II/', 'price': '$19.99', 'max_players': '8', 'steam_app_id': '200710', 'youtube_id': '8ZbFHCW6e2M'},
    {'id': 43, 'title': 'TRIBES 3: Rivals', 'url': 'https://store.steampowered.com/app/2687970/TRIBES_3_Rivals/', 'price': '$19.99', 'max_players': '32', 'steam_app_id': '2687970', 'youtube_id': 'h2X9F8Y6f7E'},
    {'id': 44, 'title': 'V Rising', 'url': 'https://store.steampowered.com/app/1604030/V_Rising/', 'price': '$34.99', 'max_players': '60', 'steam_app_id': '1604030', 'youtube_id': 'aGBZL3pQ9vI'},
    {'id': 45, 'title': 'Viscera Cleanup Detail', 'url': 'https://store.steampowered.com/app/246900/Viscera_Cleanup_Detail/', 'price': '$12.99 or $34.99 for 4-Pack', 'max_players': '32', 'steam_app_id': '246900', 'youtube_id': 'N9pX3yPdd0c'},
    {'id': 46, 'title': 'Warborne Above Ashes', 'url': 'https://store.steampowered.com/app/3142050/Warborne_Above_Ashes/', 'price': 'FREE', 'max_players': '200', 'steam_app_id': '3142050', 'youtube_id': '5XgB5XgB5Xg'},
    {'id': 47, 'title': 'Warcraft III: Reforged', 'url': 'https://warcraft3.blizzard.com/en-us/', 'price': '$29.99', 'max_players': '24', 'youtube_id': '1m7L9uLzR5g'},
    {'id': 48, 'title': 'X-MODE', 'url': 'https://store.steampowered.com/app/2265640/XMODE/', 'price': 'FREE', 'max_players': 'N/A', 'steam_app_id': '2265640', 'youtube_id': '5XgB5XgB5Xg'}
]

# Merge hardcoded games with user-submitted games
def get_all_games():
    all_games = games.copy()
    submitted = submitted_games_table.all()
    next_id = len(all_games) + 1
    for sg in submitted:
        sg['id'] = next_id
        all_games.append(sg)
        next_id += 1
    return all_games

all_games = get_all_games()

@app.route('/')
def index():
    return render_template('index.html', games=all_games)

@app.route('/vote', methods=['POST'])
def vote():
    data = request.get_json()
    user_name = data.get('user_name', '').strip()
    
    if not user_name:
        return jsonify({'success': False, 'message': 'Name is required'}), 400
    
    # Upsert user and record a new submission, preserving previous votes (history)
    UserQuery = Query()
    existing_user = users_table.get(UserQuery.name == user_name)
    result_message = 'Vote recorded successfully!'
    now_iso = datetime.utcnow().isoformat()
    if existing_user:
        user_id = existing_user['id']
        # Determine and increment this user's submission counter.
        # Derive from both users table and any existing vote rows (legacy rows may miss 'submission').
        try:
            VoteQuery = Query()
            prior_votes = votes_table.search(VoteQuery.player_id == user_id)
            max_sub_from_votes = 0
            if prior_votes:
                # Treat legacy votes with missing 'submission' as submission 1
                max_sub_from_votes = max(v.get('submission', 1) for v in prior_votes)
        except Exception:
            max_sub_from_votes = 0
        current_submission = max(existing_user.get('submission', 0), max_sub_from_votes) + 1
        users_table.update({'voted_at': now_iso, 'submission': current_submission}, UserQuery.id == user_id)
    else:
        # Create a new user starting at submission 1
        user_id = len(users_table) + 1
        current_submission = 1
        users_table.insert({'id': user_id, 'name': user_name, 'voted_at': now_iso, 'submission': current_submission})
    
    # Process the votes
    for game_id, vote_status in data.get('votes', {}).items():
        if vote_status:  # Only record if a selection was made
            votes_table.insert({
                'player_id': user_id,
                'game_id': game_id,
                'vote': vote_status,
                'voted_at': now_iso,
                'submission': current_submission
            })
    
    return jsonify({'success': True, 'message': result_message})

@app.route('/add_game', methods=['POST'])
def add_game():
    title = request.form.get('title', '').strip()
    url = request.form.get('url', '').strip()
    price = request.form.get('price', '').strip()
    max_players = request.form.get('max_players', '').strip()
    youtube_id = request.form.get('youtube_id', '').strip()

    # Basic validation
    if not title or not url:
        return redirect(url_for('index') + '?error=Title and URL are required')
    if len(title) > 100 or len(url) > 500:
        return redirect(url_for('index') + '?error=Invalid input lengths')

    # Optional: extract steam_app_id if URL is Steam
    steam_app_id = None
    if 'store.steampowered.com/app/' in url:
        try:
            steam_app_id = url.split('/app/')[1].split('/')[0]
        except:
            pass

    submitted_games_table.insert({
        'title': title,
        'url': url,
        'price': price or 'N/A',
        'max_players': max_players or 'N/A',
        'steam_app_id': steam_app_id,
        'youtube_id': youtube_id or None,
        'submitted_at': datetime.utcnow().isoformat()
    })

    # Refresh all_games
    global all_games
    all_games = get_all_games()

    return redirect(url_for('index') + '?success=Game added successfully!')

@app.route('/results')
def results_page():
    return render_template('results.html')

@app.route('/api/results')
def api_results():
    results = {}
    
    # Get all votes
    all_votes = votes_table.all()
    
    # Get all users and their latest submission numbers (fallback to deriving from votes)
    users_raw = users_table.all()
    users = {user['id']: user['name'] for user in users_raw}
    latest_submission_by_user = {}
    # Prefer users table 'submission' field if present
    for u in users_raw:
        if 'submission' in u:
            latest_submission_by_user[u['id']] = u.get('submission', 1)
    # Fallback: if missing, infer from vote rows for that user
    for v in all_votes:
        uid = v.get('player_id')
        sub = v.get('submission', 1)
        if uid is not None:
            latest_submission_by_user[uid] = max(latest_submission_by_user.get(uid, 1), sub)
    
    # Initialize results structure
    for game in all_games:
        game_id = str(game['id'])
        results[game_id] = {
            'title': game['title'],
            'interested': [],
            'not_interested': [],
            'maybe': []
        }
    
    # Populate results using only the most recent submission per user
    for vote in all_votes:
        uid = vote.get('player_id')
        # Only include if this vote belongs to the user's latest submission
        if uid is None:
            continue
        if vote.get('submission', 1) != latest_submission_by_user.get(uid, 1):
            continue
        user_name = users.get(uid, 'Unknown')
        game_id = str(vote['game_id'])
        if game_id in results:
            vote_type = vote['vote']
            if vote_type in results[game_id]:
                results[game_id][vote_type].append(user_name)
    
    # Format the response
    formatted_results = {
        'games': [],
        'top_interested': [],
        'top_maybe': [],
        'top_engagement': [],
        'total_voters': len(users_table.all())  # Include total number of voters
    }
    
    # Calculate top games
    interested_counts = []
    maybe_counts = []
    engagement_counts = []
    
    for game in all_games:
        game_id = str(game['id'])
        if game_id in results:
            game_data = results[game_id]
            interested_count = len(game_data['interested'])
            maybe_count = len(game_data['maybe'])
            engagement_count = interested_count + maybe_count
            
            formatted_results['games'].append({
                'id': game_id,
                'title': game['title'],
                'interested': game_data['interested'],
                'not_interested': game_data['not_interested'],
                'maybe': game_data['maybe'],
                'interested_count': interested_count,
                'maybe_count': maybe_count,
                'engagement_count': engagement_count
            })
            
            interested_counts.append((game['title'], interested_count))
            maybe_counts.append((game['title'], maybe_count))
            engagement_counts.append((game['title'], engagement_count, interested_count, maybe_count))
    
    # Sort and get top 10
    interested_counts.sort(key=lambda x: x[1], reverse=True)
    maybe_counts.sort(key=lambda x: x[1], reverse=True)
    # For engagement, break ties by interested then maybe
    engagement_counts.sort(key=lambda x: (x[1], x[2], x[3]), reverse=True)
    
    formatted_results['top_interested'] = [{'title': title, 'count': count} for title, count in interested_counts[:10]]
    formatted_results['top_maybe'] = [{'title': title, 'count': count} for title, count in maybe_counts[:10]]
    formatted_results['top_engagement'] = [
        {'title': title, 'count': engagement}
        for (title, engagement, _ic, _mc) in engagement_counts[:10]
    ]
    
    return jsonify(formatted_results)

@app.route('/votehistory')
def vote_history_page():
    # Build a full history list of all votes, newest first
    user_lookup = {u['id']: u['name'] for u in users_table.all()}
    game_lookup = {str(g['id']): g['title'] for g in all_games}
    history = []
    for v in votes_table.all():
        history.append({
            'voted_at': v.get('voted_at'),
            'user': user_lookup.get(v.get('player_id'), 'Unknown'),
            'game_title': game_lookup.get(str(v.get('game_id')), str(v.get('game_id'))),
            'vote': v.get('vote'),
            'submission': v.get('submission', 1),
        })
    # Sort by time desc, then by submission, then by user
    try:
        history.sort(key=lambda x: (x['voted_at'] or '', x['submission'], x['user']), reverse=True)
    except Exception:
        pass
    return render_template('votehistory.html', history=history)

@app.route('/api/steam_media/<app_id>')
def steam_media(app_id):
    """Server-side proxy to fetch Steam media to avoid browser CORS issues."""
    try:
        params = {
            'appids': app_id,
            'filters': 'movies,screenshots',
        }
        resp = requests.get(
            'https://store.steampowered.com/api/appdetails',
            params=params,
            timeout=8,
        )
        resp.raise_for_status()
        raw = resp.json()
        # Steam API returns keyed by app id (string)
        item = raw.get(app_id) or raw.get(str(app_id))
        if not item or not item.get('success'):
            return jsonify({'success': False, 'error': 'Steam API returned no data'}), 404
        data = item.get('data', {})
        return jsonify({
            'success': True,
            'movies': data.get('movies', []),
            'screenshots': data.get('screenshots', []),
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
