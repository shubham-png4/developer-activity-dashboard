import os
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
import google.generativeai as genai
import spotipy
from spotipy.oauth2 import SpotifyOAuth

app = Flask(__name__)
app.secret_key = "finbeat_super_secret_key"
app.config['SESSION_COOKIE_NAME'] = 'FinBeat Cookie'

# --- SQLite Database Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///expenses.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Model Definition
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "amount": self.amount,
            "description": self.description or ""
        }

# Create database tables automatically
with app.app_context():
    db.create_all()

# --- AI Configuration (Gemini API) ---
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_KEY_HERE"))
model = genai.GenerativeModel('gemini-1.5-flash')

# --- Spotify API Configuration ---
SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "YOUR_SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "YOUR_SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = "http://localhost:5000/spotify-callback"

def get_spotify_oauth():
    return SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope="user-library-read playlist-modify-public playlist-read-private"
    )

# --- Application Routes ---

@app.route('/')
def index():
    db_expenses = Expense.query.all()
    expense_list = [exp.to_dict() for exp in db_expenses]
    total_spent = sum(exp['amount'] for exp in expense_list)
    spotify_connected = bool(session.get('token_info', None))

    return render_template(
        'index.html', 
        expenses=expense_list, 
        total_spent=total_spent, 
        spotify_connected=spotify_connected
    )

@app.route('/add-expense', methods=['POST'])
def add_expense():
    data = request.json
    category = data.get('category')
    amount = data.get('amount')
    description = data.get('description', '')
    
    if category and amount is not None:
        try:
            new_expense = Expense(
                category=category, 
                amount=float(amount), 
                description=description
            )
            db.session.add(new_expense)
            db.session.commit()
            return jsonify({"status": "success", "message": "Expense saved!"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
            
    return jsonify({"status": "error", "message": "Invalid data submitted."}), 400

@app.route('/edit-expense/<int:expense_id>', methods=['PUT'])
def edit_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    data = request.json
    
    try:
        expense.category = data.get('category', expense.category)
        expense.amount = float(data.get('amount', expense.amount))
        expense.description = data.get('description', expense.description)
        db.session.commit()
        return jsonify({"status": "success", "message": "Expense updated!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/delete-expense/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    try:
        db.session.delete(expense)
        db.session.commit()
        return jsonify({"status": "success", "message": "Expense deleted!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/ai-analyze', methods=['GET'])
def ai_analyze():
    db_expenses = Expense.query.all()
    if not db_expenses:
        return jsonify({
            "critique": "No expenses stored in the database yet. Add some records to process!",
            "music_genre": "Lo-Fi Chill"
        })
    
    expense_data = [exp.to_dict() for exp in db_expenses]
    expense_summary = json.dumps(expense_data, indent=2)
    
    prompt = f"""
    You are a professional financial advisor mixed with a music psychologist. 
    Analyze the following recent personal expenses data:
    {expense_summary}
    
    Provide a concise, 2-sentence financial critique or encouraging remark about their spending habits. 
    Then, suggest a specific 'Vibe/Genre' of music they should listen to right now based on their financial health.
    
    Format the output strictly as a JSON object with two keys: "critique" and "music_genre". Do not wrap it in markdown codeblocks.
    """
    
    try:
        response = model.generate_content(prompt)
        ai_data = json.loads(response.text.strip())
        session['last_suggested_genre'] = ai_data.get('music_genre', 'lofi')
        return jsonify(ai_data)
    except Exception as e:
        return jsonify({
            "critique": "AI analysis unavailable, but keep tracking!", 
            "music_genre": "Lo-Fi Beats"
        })

@app.route('/spotify-login')
def spotify_login():
    sp_oauth = get_spotify_oauth()
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@app.route('/spotify-callback')
def spotify_callback():
    sp_oauth = get_spotify_oauth()
    session.clear()
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    session['token_info'] = token_info
    return redirect(url_for('index'))

@app.route('/get-playlist', methods=['GET'])
def get_playlist():
    token_info = session.get('token_info', None)
    if not token_info:
        return jsonify({"error": "Spotify not authenticated"}), 401
    
    sp = spotipy.Spotify(auth=token_info['access_token'])
    genre_query = session.get('last_suggested_genre', 'chill out hits')
    
    try:
        results = sp.search(q=genre_query, type='playlist', limit=3)
        playlists = results['playlists']['items']
        
        output_playlists = []
        for p in playlists:
            output_playlists.append({
                "name": p['name'],
                "url": p['external_urls']['spotify'],
                "image": p['images'][0]['url'] if p['images'] else ''
            })
            
        return jsonify({"playlists": output_playlists, "query": genre_query})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)