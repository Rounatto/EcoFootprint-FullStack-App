import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()
app = Flask(__name__)

# Accept both standard and legacy variable names.
url = os.environ.get("SUPABASE_URL") or os.environ.get("Supabase_URL")
key = os.environ.get("SUPABASE_KEY") or os.environ.get("Supabase_key")
supabase: Client | None = create_client(url, key) if url and key else None

@app.route('/')
def home():
    # Render the main dashboard page.
    return render_template('index.html')

@app.route('/api/add-activity', methods=['POST'])
def add_activity():
    # Save one activity row into Supabase.
    if supabase is None:
        return jsonify({
            "status": "error",
            "message": "Supabase is not configured. Check SUPABASE_URL and SUPABASE_KEY in .env"
        }), 500

    try:
        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict) or not data:
            return jsonify({
                "status": "error",
                "message": "Invalid or empty JSON payload"
            }), 400

        response = supabase.table('activities').insert(data).execute()
        return jsonify({
            "status": "success",
            "message": "Activite sauvegardee avec succes",
            "data": response.data
        }), 201
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


if __name__ == '__main__':
    # Run Flask app in development mode.
    app.run(debug=True)