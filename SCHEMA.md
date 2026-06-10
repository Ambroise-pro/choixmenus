# 📋 Schéma des Données Excel

## Structure requise du fichier Excel

Le fichier doit être au format `.xlsx` et contenir les colonnes suivantes :

| Colonne | Obligatoire | Type | Description |
|---------|-------------|------|-------------|
| Prénom | ✅ | Texte | Prénom de l'étudiant |
| Nom | ✅ | Texte | Nom de l'étudiant |
| Classe | ✅ | Texte | Classe/niveau (ex: TA, TC, 1A) |
| Classe les 5 menus obligatoires par ordre de préférence. | ✅ | Texte | Les 5 menus avec leurs activités |
| Note au premier trimestre | ⚠️ | Nombre ou texte | Note T1 (peut contenir du texte) |
| Note au deuxième trimestre | ⚠️ | Nombre ou texte | Note T2 (peut contenir du texte) |
| Note au troisième trimestre | ⚠️ | Nombre ou texte | Note T3 (peut contenir du texte) |

> ⚠️ Les notes peuvent contenir du texte (ex: "Natation 12") - les nombres seront extraits automatiquement

## Format des menus

Les menus doivent suivre ce format exactement :

```
Menu A : Activité1 / Activité2 / Activité3 ;Menu B : Activité1 / Activité2 / Activité3 ;...
```

### Exemple complet
```
Menu A : Demi-fond / Escalade / Badminton ;Menu B : Escalade / Volley-ball / Demi-fond ;Menu C : Danse / Natation / Step ;Menu D : Volley-ball / Danse / Natation ;Menu E : Foot / Musculation / Demi-fond ;
```

### Éléments du format
- **Menu X** : Lettre du menu (A-E)
- **Activité** : Nom de l'activité (Escalade, Badminton, Natation, etc.)
- **/** : Séparateur entre les activités
- **;** : Séparateur entre les menus

## Exemple de fichier Excel

| Prénom | Nom | Classe | Classe les 5 menus... | Note T1 | Note T2 | Note T3 |
|--------|-----|--------|----------------------|---------|---------|---------|
| Jean | Dupont | TA | Menu A : Demi-fond / Escalade / Badminton ;Menu B : Escalade / Volley-ball / Demi-fond ;Menu C : Danse / Natation / Step ;Menu D : Volley-ball / Danse / Natation ;Menu E : Foot / Musculation / Demi-fond ; | 15.5 | 16.0 | 14.5 |
| Marie | Martin | TA | Menu B : Escalade / Volley-ball / Demi-fond ;Menu A : Demi-fond / Escalade / Badminton ;Menu E : Foot / Musculation / Demi-fond ;Menu D : Volley-ball / Danse / Natation ;Menu C : Danse / Natation / Step ; | Escalade 14 | VB 15 | Demi 13 |

## Traitement des données

### Parsing des menus
L'application extrait automatiquement :
- ✅ La lettre du menu (A, B, C, D, E)
- ✅ L'ordre des préférences (1er choix = Menu A, 2e = Menu B, etc.)
- ✅ Les activités associées à chaque menu

### Extraction des notes
L'application extrait le **premier nombre** trouvé dans le champ, donc :
- `15.5` → 15.5
- `Escalade 14` → 14
- `VB 15.2` → 15.2
- `Note: 16 / 20` → 16

## Validation

L'application vérifie automatiquement :
- ✅ Toutes les colonnes requises présentes
- ✅ Au moins 1 étudiant avec des menus valides
- ✅ Format des menus corrects
- ⚠️ Les espaces et caractères spéciaux

## Algorithme d'assignation

Pour chaque étudiant, l'application :

1. **Groupe par 1er choix** : Regroupe les étudiants ayant le même Menu A
2. **Tri par niveau** : Trie par moyenne de notes (du plus haut au plus bas)
3. **Distribution round-robin** : Assigne à tour de rôle aux activités du menu choisi
4. **Équilibrage** : Crée des groupes de taille et niveau similaire

### Exemple
- Ambroise + Menu B premier choix → assigné à Escalade
- dqs dsq + Menu B premier choix → assigné à Demi-fond
- Résultat : deux groupes équilibrés

## Export Excel

L'export génère un fichier avec :

1. **Feuille "Récapitulatif"** (index 0)
   - Tableau avec nombre d'étudiants et moyenne par groupe
   
2. **Feuille par activité** (à partir de l'index 1)
   - Prénom, Nom, Classe, Moyenne
   - Triée par classe puis par nom

## Limitations et considérations

- ⚠️ Maximum 31 caractères pour le nom de la feuille Excel
- ⚠️ Les notes vides ou invalides sont traitées comme 0
- ⚠️ Nécessite au minimum 1 étudiant avec des menus valides
- ℹ️ Pour de bons résultats d'équilibrage, utilisez 10+ étudiants

## Dépannage

**"Aucun étudiant trouvé avec des choix de menus"**
- Vérifiez la colonne "Classe les 5 menus..."
- Vérifiez le format des menus (Menu A : ... ;Menu B : ...)
- Assurez-vous qu'au moins 1 étudiant a un menu valide

**Groupes vides**
- C'est normal s'il y a peu d'étudiants
- Augmentez le nombre d'étudiants pour voir tous les groupes remplis

**Notes incorrectes**
- Vérifiez que vous ne dépassez pas 20/20
- Les notes manquantes deviennent 0
