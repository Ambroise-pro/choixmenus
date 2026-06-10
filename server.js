const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { createBalancedGroups } = require('./algorithm');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));
app.use(express.json());

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const students = data.map((row, index) => ({
      id: index,
      nom: row['Prénom ']?.trim() || '',
      prenom: row['Nom']?.trim() || '',
      classe: row['Classe ']?.trim() || '',
      menus: parseMenuChoices(row['Classe les 5 menus obligatoires par ordre de préférence.'] || ''),
      note1: parseFloat(row['Note au premier trimestre']) || 0,
      note2: parseFloat(row['Note au deuxième trimestre']) || 0,
      note3: parseFloat(row['Note au troisième trimestre']) || 0
    })).filter(s => s.menus.length > 0);

    if (students.length === 0) {
      return res.status(400).json({ error: 'Aucun étudiant trouvé avec des choix de menus' });
    }

    const groups = createBalancedGroups(students);
    res.json({ students, groups });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export', (req, res) => {
  try {
    const { groups } = req.body;

    const wb = xlsx.utils.book_new();

    // Créer une feuille pour chaque activité
    Object.entries(groups).forEach(([activity, groupData]) => {
      const wsData = [
        [groupData.name.toUpperCase()],
        [],
        ['Prénom', 'Nom', 'Classe', 'Moyenne'],
        ...groupData.members.map(m => [m.prenom, m.nom, m.classe, m.avgGrade])
      ];

      const ws = xlsx.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 }
      ];

      xlsx.utils.book_append_sheet(wb, ws, activity.substring(0, 31));
    });

    // Créer une feuille récapitulatif
    const summaryData = [
      ['RÉSUMÉ DES GROUPES'],
      [],
      ['Activité', 'Nombre d\'étudiants', 'Moyenne'],
      ...Object.entries(groups).map(([activity, groupData]) => [
        groupData.name,
        groupData.count,
        groupData.avgGrade
      ])
    ];

    const summarws = xlsx.utils.aoa_to_sheet(summaryData);
    summarws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    xlsx.utils.book_append_sheet(wb, summarws, 'Récapitulatif', 0);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="groupes_${new Date().toISOString().slice(0, 10)}.xlsx"`
    });

    res.send(xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' }));
  } catch (error) {
    console.error('Erreur export:', error);
    res.status(500).json({ error: error.message });
  }
});

function parseMenuChoices(text) {
  if (!text || typeof text !== 'string') return [];

  const menus = [];
  const menuPattern = /Menu\s+([A-E])\s*:\s*([^;]+)/gi;
  let match;

  while ((match = menuPattern.exec(text)) !== null) {
    const letter = match[1];
    const activities = match[2].split('/').map(a => a.trim());
    menus.push({
      letter,
      activities,
      order: menus.length + 1
    });
  }

  return menus;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
