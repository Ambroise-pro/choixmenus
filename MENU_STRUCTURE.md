# 📋 Structure des Menus - Explications

## 🎯 Concept Principal

Les menus sont des **blocs inséparables de 3 activités**. Les 3 activités d'un menu **doivent rester ensemble**.

### Les 5 Menus

```
Menu A : Demi-fond / Escalade / Badminton
Menu B : Escalade / Volley-ball / Demi-fond
Menu C : Danse / Natation / Step
Menu D : Volley-ball / Danse / Natation
Menu E : Foot / Musculation / Demi-fond
```

## 📊 Préférences des Étudiants

Chaque étudiant choisit **5 menus par ordre de préférence**.

### Exemple
Un étudiant choisit dans cet ordre :
```
1ère préférence : Menu D (Volley-ball / Danse / Natation)
2ème préférence : Menu E (Foot / Musculation / Demi-fond)
3ème préférence : Menu C (Danse / Natation / Step)
4ème préférence : Menu B (Escalade / Volley-ball / Demi-fond)
5ème préférence : Menu A (Demi-fond / Escalade / Badminton)
```

## 🔄 Algorithme de Groupement

### Avant (❌ ANCIEN)
```
9 groupes séparés par activité :
├─ Demi-fond (groupe seul)
├─ Escalade (groupe seul)
├─ Badminton (groupe seul)
├─ Volley-ball (groupe seul)
├─ Danse (groupe seul)
├─ Natation (groupe seul)
├─ Foot (groupe seul)
├─ Musculation (groupe seul)
└─ Step (groupe seul)
```

❌ **Problème** : Les 3 activités du même menu étaient séparées !

### Après (✅ NOUVEAU)
```
5 groupes par menu (avec 3 activités ensemble) :
├─ Menu A : Demi-fond + Escalade + Badminton
├─ Menu B : Escalade + Volley-ball + Demi-fond
├─ Menu C : Danse + Natation + Step
├─ Menu D : Volley-ball + Danse + Natation
└─ Menu E : Foot + Musculation + Demi-fond
```

✅ **Solution** : Les 3 activités restent toujours ensemble !

## 📋 Processus

### Étape 1 : Grouper par 1ère préférence
```
140 étudiants
    ↓
Lire le 1er choix de chaque étudiant
    ↓
Grouper par menu
    └─ Menu A : 36 étudiants
    └─ Menu B : 30 étudiants
    └─ Menu C : 28 étudiants
    └─ Menu D : 25 étudiants
    └─ Menu E : 21 étudiants
```

### Étape 2 : Distribuer dans les 3 activités du menu
```
Menu A (36 étudiants)
    ├─ Demi-fond : 12 étudiants
    ├─ Escalade : 12 étudiants
    └─ Badminton : 12 étudiants

Menu B (30 étudiants)
    ├─ Escalade : 10 étudiants
    ├─ Volley-ball : 10 étudiants
    └─ Demi-fond : 10 étudiants

(etc.)
```

## 🎨 Affichage Interface

### Structure Visuelle
```
┌─────────────────────────────────────────┐
│ Menu A                                  │
│ 👥 36 étudiants                        │
├─────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────────┐ │
│  │ Badminton    │ │ Demi-fond        │ │
│  ├──────────────┤ ├──────────────────┤ │
│  │ Marie (TA)   │ │ Claire (TA)      │ │
│  │ Monique (TA) │ │ Luc (TA)         │ │
│  │ Nicole (TB)  │ │ Paul (TB)        │ │
│  │ ...          │ │ ...              │ │
│  └──────────────┘ └──────────────────┘ │
│  ┌──────────────┐                      │
│  │ Escalade     │                      │
│  ├──────────────┤                      │
│  │ Jean (TB)    │                      │
│  │ Pierre (TC)  │                      │
│  │ ...          │                      │
│  └──────────────┘                      │
│                                        │
│ Préférences : Menu A : 36             │
└─────────────────────────────────────────┘
```

Les 3 activités s'affichent **côte à côte** (grid layout).

## 📊 Statistiques

### Avec 140 étudiants

| Métrique | Avant | Après |
|----------|-------|-------|
| Nombre de groupes | 9 | 5 |
| Taille moyenne | 15.6 | 28.0 |
| Activités par groupe | 1 | 3 |
| Cohésion du menu | Séparé ❌ | Ensemble ✅ |

## 🎯 Avantages

✅ **Respecte la structure des menus** : Les 3 activités restent toujours ensemble

✅ **Plus simple** : 5 groupes au lieu de 9

✅ **Meilleure logique** : Un groupe = Un menu avec ses 3 activités

✅ **Flexible** : Max students limit s'applique par activité dans le menu

## 📍 Exemple avec Max Limit = 15

Avec limitation à 15 étudiants par activité :

```
Menu A (36 étudiants)
    ├─ Demi-fond : 12 étudiants ✅ (< 15)
    ├─ Escalade : 12 étudiants ✅ (< 15)
    └─ Badminton : 12 étudiants ✅ (< 15)

Menu B (30 étudiants)
    ├─ Escalade : 10 étudiants ✅ (< 15)
    ├─ Volley-ball : 10 étudiants ✅ (< 15)
    └─ Demi-fond : 10 étudiants ✅ (< 15)
```

## 🔄 Interactions Utilisateur

### Charger un fichier
1. Ouvrir http://localhost:3000
2. (Optionnel) Entrer "Max étudiants par activité"
3. Charger votre Excel
4. Les 5 groupes (menus) s'affichent

### Voir les notes
- Cliquer sur un étudiant
- Popup affiche T1, T2, T3

### Exporter
- Bouton "Exporter en Excel"
- Crée une feuille par menu

---

**Résumé** : Les menus sont des blocs de 3 activités inséparables. L'application crée 5 groupes (un par menu) et distribue équitablement les étudiants entre les 3 activités de chaque menu.
