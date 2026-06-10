# 🏃 Équilibreur de Groupes EPS

Une application pour créer automatiquement des groupes équilibrés en fonction des choix de menus des étudiants.

## 🎯 Fonctionnalités

- **Charger un fichier Excel** avec les choix de menus et les notes
- **Créer des groupes équilibrés** en distribuant les étudiants selon leurs préférences
- **Équilibre par niveau** : les groupes ont une moyenne de notes similaire
- **Visualisation intuitive** avec les statistiques de chaque groupe
- **Exporter les résultats** en Excel avec un détail par activité

## 🚀 Installation et utilisation

### Prérequis
- Node.js 14+ installé
- Fichier Excel avec les choix de menus

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Format du fichier Excel

Le fichier doit contenir les colonnes suivantes :
- **Prénom** : Prénom de l'étudiant
- **Nom** : Nom de l'étudiant
- **Classe** : Classe/niveau
- **Classe les 5 menus obligatoires par ordre de préférence** : Les 5 menus choisis par ordre de préférence au format :
  ```
  Menu A : Demi-fond / Escalade / Badminton ;Menu B : Escalade / Volley-ball / Demi-fond ;...
  ```
- **Note au premier trimestre** : Note T1
- **Note au deuxième trimestre** : Note T2
- **Note au troisième trimestre** : Note T3

### Utilisation

1. Ouvrez `http://localhost:3000` dans votre navigateur
2. Glissez-déposez votre fichier Excel ou cliquez pour le sélectionner
3. Les groupes sont générés automatiquement
4. Visualisez les résultats et les statistiques
5. Exportez en Excel en cliquant sur le bouton "Exporter"

## 🔧 Algorithme d'équilibrage

1. **Groupe par premier choix** : Les étudiants sont d'abord groupés par leur première préférence
2. **Tri par niveau** : Au sein de chaque groupe, les étudiants sont triés par moyenne (du plus haut au plus bas)
3. **Distribution équitable** : Les étudiants sont distribués round-robin entre les activités de leur menu préféré
4. **Résultat** : Des groupes équilibrés en termes de :
   - Taille
   - Niveau académique (moyenne des notes)
   - Préférences de menus

## 📊 Résultats générés

Pour chaque activité/groupe, vous obtenez :
- **Liste des étudiants** avec leurs notes moyennes
- **Taille du groupe**
- **Moyenne du groupe**
- **Distribution des préférences** (combien d'étudiants du Menu A, B, C, etc.)

## 📁 Structure du projet

```
.
├── server.js           # Serveur Express principal
├── algorithm.js        # Logique d'équilibrage
├── package.json        # Dépendances
├── public/
│   ├── index.html      # Page principale
│   ├── style.css       # Styles
│   └── app.js          # JavaScript frontend
└── README.md           # Ce fichier
```

## 🛠 Technologie

- **Backend** : Node.js + Express
- **Frontend** : HTML5 + CSS3 + JavaScript
- **Traitement Excel** : XLSX library
- **Styling** : CSS Grid + Flexbox

## 📝 Licence

Libre d'utilisation pour l'EPS Vauban

---

**Crée avec ❤️ pour l'EPS Vauban**
