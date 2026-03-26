# Lecture Human Design — Guide de déploiement

## Ce dont tu as besoin

- Un compte GitHub (github.com)
- Un compte Vercel (vercel.com)
- Un compte API Anthropic (console.anthropic.com)


## Étape 1 — Récupérer ta clé API Anthropic

1. Va sur https://console.anthropic.com
2. Connecte-toi ou crée un compte
3. Va dans "Settings" > "API keys"
4. Clique "Create Key", donne-lui un nom (ex: "human-design")
5. Copie la clé qui commence par "sk-ant-..." — garde-la quelque part, tu en auras besoin
6. Va dans "Settings" > "Limits" et mets une limite de dépense (ex: 20$/mois)
7. Tu devras ajouter un moyen de paiement (carte bancaire) dans "Billing"


## Étape 2 — Créer le projet sur GitHub

1. Va sur https://github.com/new
2. Nom du projet : "human-design-reader" (ou ce que tu veux)
3. Laisse en "Public" (ou "Private" si tu préfères)
4. Clique "Create repository"
5. Sur la page du repo, clique "uploading an existing file" (le lien bleu)
6. Glisse TOUS les fichiers du dossier hd-app dedans :
   - package.json
   - next.config.js
   - .gitignore
   - app/layout.js
   - app/page.js
   - app/api/claude/route.js
7. Clique "Commit changes"

IMPORTANT : respecte bien la structure des dossiers. Les fichiers dans "app/" doivent être dans un dossier "app", et "route.js" doit être dans "app/api/claude/".


## Étape 3 — Déployer sur Vercel

1. Va sur https://vercel.com
2. Connecte-toi avec ton compte GitHub
3. Clique "Add New..." > "Project"
4. Tu verras ton repo "human-design-reader" — clique "Import"
5. Dans "Environment Variables", ajoute :
   - Name : ANTHROPIC_API_KEY
   - Value : ta clé API (celle qui commence par sk-ant-...)
6. Clique "Deploy"
7. Attends que le déploiement finisse (1-2 minutes)
8. Vercel te donne une URL du type : human-design-reader.vercel.app

C'est cette URL que tu partages à tout le monde.


## Coûts

- Vercel : gratuit (plan Hobby)
- GitHub : gratuit
- API Anthropic : environ 0.05€ à 0.15€ par lecture complète (extraction + analyse)
  - Si 100 personnes utilisent l'app dans le mois, ça fait environ 5-15€
  - Tu contrôles le budget via la limite de dépense sur console.anthropic.com


## Si tu veux changer l'URL

Par défaut Vercel te donne un sous-domaine .vercel.app. Si tu veux un domaine custom (ex: hd.lauriepiffero.fr) :
1. Va dans les settings de ton projet sur Vercel
2. "Domains" > ajoute ton domaine
3. Configure le DNS chez ton hébergeur (ajoute un CNAME qui pointe vers cname.vercel-dns.com)


## Si quelque chose ne marche pas

- Erreur au déploiement : vérifie que la structure des fichiers est bonne (app/page.js, app/api/claude/route.js)
- Erreur "Clé API non configurée" : vérifie la variable d'environnement ANTHROPIC_API_KEY dans Vercel
- Erreur à l'analyse : vérifie que ta clé API est active et que tu as du crédit sur console.anthropic.com
