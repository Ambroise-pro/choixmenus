# 🚀 DÉMARRAGE IMMÉDIAT

## Commande unique pour démarrer

```bash
npm start
```

Puis ouvrir : **http://localhost:3000**

---

## 3 Façons d'utiliser l'app

### 1️⃣ **Mode Démo** (test rapide)
```
http://localhost:3000/?demo
```
Voit les résultats avec des données de test sans charger de fichier.

### 2️⃣ **Mode Upload** (utilisation réelle)
```
http://localhost:3000
```
Charger votre fichier Excel en glisser-déposer ou clic.

### 3️⃣ **API Direct** (pour intégration)
```bash
curl -X POST -F "file=@votre_fichier.xlsx" http://localhost:3000/api/upload
```

---

## Format du fichier Excel attendu

Colonnes requises :
- ✅ **Prénom** : Jean
- ✅ **Nom** : Dupont
- ✅ **Classe** : TA
- ✅ **Classe les 5 menus...** : Menu A : Act1 / Act2 / Act3 ;Menu B : ...
- ✅ **Note au premier trimestre** : 15 (ou "Escalade 15")
- ✅ **Note au deuxième trimestre** : 14
- ✅ **Note au troisième trimestre** : 13

👉 Voir `SCHEMA.md` pour le format exact des menus

---

## Premier test en 2 minutes

1. **Démarrer le serveur**
   ```bash
   npm start
   ```

2. **Ouvrir en navigateur**
   ```
   http://localhost:3000/?demo
   ```
   Vous verrez les résultats avec données de test

3. **Exporter les résultats**
   Cliquer le bouton "📥 Exporter en Excel"
   
4. **Charger votre fichier**
   Retour à http://localhost:3000 et chargez votre Excel

---

## Structure du projet

```
├── server.js           ← Serveur Node.js (à démarrer avec npm start)
├── algorithm.js        ← Logique d'équilibrage des groupes
├── public/             ← Interface web
│   ├── index.html      ← Page principale
│   ├── style.css       ← Design responsive
│   └── app.js          ← Interactions utilisateur
├── package.json        ← Dépendances npm
├── README.md           ← Documentation complète
├── QUICKSTART.md       ← Guide démarrage rapide
├── SCHEMA.md           ← Format exact des données
└── PROJECT_SUMMARY.md  ← Résumé du projet
```

---

## Problèmes courants

**❌ "Cannot find module"**
```bash
npm install
```

**❌ "Port 3000 already in use"**
```bash
PORT=3001 npm start
```

**❌ "Aucun étudiant trouvé"**
- Vérifier colonnes du fichier Excel
- Vérifier format des menus (Menu A : ... ;Menu B : ...)
- Voir `SCHEMA.md`

---

## Prochaines étapes

- ✅ L'app est **prête à l'emploi**
- ✅ Charger vos fichiers Excel réels
- ✅ Créer des groupes pour votre année
- ✅ Exporter et utiliser directement

---

## Besoin d'aide ?

- 📖 **Aide générale** → `README.md`
- ⚡ **Démarrage rapide** → `QUICKSTART.md`
- 📋 **Format Excel** → `SCHEMA.md`
- 📊 **Architecture** → `PROJECT_SUMMARY.md`

---

**Application prête ! 🎉**

Lancez maintenant : `npm start`
