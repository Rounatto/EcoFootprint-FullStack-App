import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()
app = Flask(__name__)

# Accept both standard and legacy variable names.
url = os.environ.get("SUPABASE_URL") or os.environ.get("Supabase_URL")
key = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or os.environ.get("Supabase_key")
)
supabase: Client | None = create_client(url, key) if url and key else None

@app.route('/')
def home():
    # Render the main dashboard page.
    return render_template('index.html')

@app.route('/api/add-activity', methods=['POST'])
def add_activity():
    # Save one activity row into Supabase.
    try:
        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict) or not data:
            return jsonify({
                "status": "error",
                "message": "Invalid or empty JSON payload"
            }), 400

        if supabase is None:
            return jsonify({
                "status": "success",
                "message": "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
            }), 500

        response = supabase.table('activities').insert(data).execute()
        return jsonify({
            "status": "success",
            "message": "Activite sauvegardee avec succes",
            "data": response.data,
            "storage": "supabase"
        }), 201
    except Exception as e:
        error_message = str(e)
        if "row-level security" in error_message.lower() or "42501" in error_message:
            error_message = (
                "Supabase blocked the insert because Row Level Security is enabled. "
                "Add an INSERT policy for public.activities or use SUPABASE_SERVICE_ROLE_KEY."
            )
        return jsonify({
            "status": "error",
            "message": error_message
        }), 400

# ==========================================
# NOUVELLE ROUTE : LIRE L'HISTORIQUE (GET)
# ==========================================
@app.route('/api/activities', methods=['GET'])
def get_activities():
    try:
        if supabase is None:
            return jsonify({"status": "error", "message": "Supabase non configuré"}), 500

        # On demande à Supabase de sélectionner toutes les lignes
        # et de les trier par date de création (les plus récentes en premier)
        response = supabase.table('activities').select('*').order('created_at', desc=True).execute()
        
        # On renvoie l'historique au site web
        return jsonify({
            "status": "success", 
            "data": response.data
        }), 200
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
@app.route('/api/delete-activity/<int:activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    try:
        if supabase is None:
            return jsonify({"status": "error", "message": "Supabase non configuré"}), 500

        # Delete the activity row by its numeric id.
        response = supabase.table('activities').delete().eq('id', activity_id).execute()

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "Aucune activite trouvee pour cet ID"
            }), 404

        return jsonify({
            "status": "success",
            "message": "Activité supprimée avec succès"
        }), 200

    except Exception as e:
        error_message = str(e)
        if "row-level security" in error_message.lower() or "42501" in error_message:
            error_message = (
                "Supabase blocked the delete because Row Level Security is enabled. "
                "Add a DELETE policy for public.activities or use SUPABASE_SERVICE_ROLE_KEY."
            )
        return jsonify({"status": "error", "message": error_message}), 400
@app.route('/api/add-goal', methods=['POST'])
def add_goal():
    try:
        data = request.get_json(silent=True)
        if supabase is None:
            return jsonify({"status": "error", "message": "Supabase non configuré"}), 500

        response = supabase.table('goals').insert(data).execute()
        return jsonify({"status": "success", "data": response.data}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/goals', methods=['GET'])
def get_goals():
    try:
        response = supabase.table('goals').select('*').execute()
        return jsonify({"status": "success", "data": response.data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
if __name__ == '__main__':
    # Run Flask app in development mode.
    app.run(debug=True)