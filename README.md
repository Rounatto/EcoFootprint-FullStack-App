# 🌍 EcoFootprint Full-Stack App

Une application web interactive permettant aux utilisateurs de calculer, suivre et analyser leur empreinte carbone, avec un accent particulier sur les trajets écologiques.

## 🚀 Fonctionnalités Principales
* **Tableau de bord dynamique :** Visualisation des émissions de CO2.
* **Calculateur de trajets :** Comparaison de l'empreinte carbone selon le moyen de transport.
* **Historique et Objectifs :** Sauvegarde des données utilisateurs pour un suivi à long terme.

## 🛠️ Tech Stack
* **Frontend :** HTML5, CSS3 (Variables natives, Flexbox), Vanilla JavaScript, Leaflet.js (Cartographie).
* **Backend :** Python, Flask.
* **Base de Données :** PostgreSQL (hébergé sur Supabase).

## 📸 Aperçu du Projet
![Dashboard1 EcoFootprint](static/images/dashboard1.png)
![Dashboard2 EcoFootprint](static/images/dashboard2.png)
![Base de données Supabase](static/images/supabasedb.png)
## 💻 Installation en Local
Pour faire tourner ce projet sur votre machine :

1. Clonez le dépôt :
   \`git clone https://github.com/Rounatto/EcoFootprint-FullStack-App.git\`
2. Installez les dépendances :
   \`pip install -r requirements.txt\`
3. Créez un fichier \`.env\` à la racine avec vos clés Supabase :
   \`SUPABASE_URL=votre_url\`
   \`SUPABASE_KEY=votre_cle\`
4. Lancez le serveur Flask :
   \`python app.py\`