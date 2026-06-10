# 🚀 Démarrage Rapide

## Installation (5 minutes)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Démarrer le serveur
```bash
npm start
```

Le serveur démarre sur **http://localhost:3000**

## Utilisation

### Via l'interface web
1. Ouvrez http://localhost:3000 dans votre navigateur
2. **Glissez-déposez** votre fichier Excel ou **cliquez** pour le sélectionner
3. Les groupes se créent **automatiquement**
4. Visualisez les résultats et les statistiques
5. **Exportez en Excel** en cliquant sur le bouton

### Via l'API (curl)
```bash
# Upload un fichier
curl -X POST -F "file=@votre_fichier.xlsx" http://localhost:3000/api/upload

# Export les résultats (après avoir uploadé)
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d @data.json > groupes.xlsx
```

## Format du fichier Excel

Votre fichier doit contenir ces colonnes :
- **Prénom** : Prénom de l'étudiant
- **Nom** : Nom de l'étudiant  
- **Classe** : Classe/niveau (ex: TA, TC)
- **Classe les 5 menus obligatoires par ordre de préférence** : Les 5 menus choisis
- **Note au premier trimestre** : Note T1
- **Note au deuxième trimestre** : Note T2
- **Note au troisième trimestre** : Note T3

### Format des menus
Les menus doivent être formatés comme :
```
Menu A : Activité1 / Activité2 / Activité3 ;
Menu B : Activité1 / Activité2 / Activité3 ;
Menu C : Activité1 / Activité2 / Activité3 ;
...
```

Exemple :
```
Menu A : Demi-fond / Escalade / Badminton ;
Menu B : Escalade / Volley-ball / Demi-fond ;
Menu C : Danse / Natation / Step ;
```

## 🎯 Comment ça marche ?

L'algorithme crée des **groupes équilibrés** en :

1. **Respectant les préférences** : Les étudiants ayant le même 1er choix sont groupés
2. **Équilibrant les niveaux** : Les notes sont distribuées pour des groupes homogènes
3. **Maximisant le choix** : Chaque groupe contient des étudiants d'activités différentes du même menu

## 📊 Résultats générés

Pour chaque activité/groupe, vous obtenez :
- ✅ **Liste des étudiants** avec notes moyennes
- 👥 **Taille du groupe**
- ⭐ **Moyenne académique du groupe**
- 📋 **Distribution des préférences de menus**

## 💡 Astuce

- Pour de **meilleurs résultats**, utilisez un fichier Excel avec **au minimum 10-20 étudiants**
- Assurez-vous que **tous les étudiants ont 5 choix de menus**
- Les **notes manquantes** sont considérées comme 0

## 🔧 Dépannage

**L'app ne démarre pas ?**
```bash
# Vérifier si le port 3000 est libre
lsof -i :3000
# Sinon, changer le port
PORT=3001 npm start
```

**Erreur lors du chargement du fichier ?**
- Vérifiez les colonnes (noms exacts requis)
- Assurez-vous que le fichier est en .xlsx (pas .xls)
- Vérifiez qu'il y a au moins 1 étudiant avec des menus

## 📝 License
Libre d'utilisation pour l'EPS Vauban

---

**Questions ?** Consultez le [README.md](README.md) pour plus de détails.
