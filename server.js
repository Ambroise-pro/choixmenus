const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { createBalancedGroups } = require('./algorithm');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const maxStudents = req.body.maxStudents ? parseInt(req.body.maxStudents) : null;
    const numMenus = req.body.numMenus ? parseInt(req.body.numMenus) : null;

    console.log('Debug - numMenus:', numMenus, 'maxStudents:', maxStudents, 'body:', req.body);

    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Trouver les colonnes correctes (avec espaces insécables possibles)
    const headers = Object.keys(data[0] || {});
    const findColumn = (pattern) => headers.find(h => h.includes(pattern));

    const prenomCol = findColumn('Prénom') || 'Prénom ';
    const nomCol = findColumn('Nom') || 'Nom';
    const classeCol = findColumn('Classe') && !findColumn('Classe').includes('menus') ? findColumn('Classe') : 'Classe ';
    const menusCol = findColumn('menus') || 'Classe les 5 menus obligatoires par ordre de préférence.';
    const note1Col = findColumn('premier trimestre') || 'Note au premier trimestre';
    const note2Col = findColumn('deuxième trimestre') || 'Note au deuxième trimestre';
    const note3Col = findColumn('troisième trimestre') || 'Note au troisième trimestre';

    const students = data.map((row, index) => {
      const menus = parseMenuChoices(row[menusCol] || '');
      if (menus.length === 0) return null;

      const note1Data = parseNoteWithActivity(row[note1Col]);
      const note2Data = parseNoteWithActivity(row[note2Col]);
      const note3Data = parseNoteWithActivity(row[note3Col]);

      return {
        id: index,
        nom: (row[nomCol] || '').trim(),
        prenom: (row[prenomCol] || '').trim(),
        classe: (row[classeCol] || '').trim(),
        menus,
        note1: note1Data.note,
        note1Activity: note1Data.activity,
        note2: note2Data.note,
        note2Activity: note2Data.activity,
        note3: note3Data.note,
        note3Activity: note3Data.activity
      };
    }).filter(s => s !== null);

    if (students.length === 0) {
      return res.status(400).json({ error: 'Aucun étudiant trouvé avec des choix de menus' });
    }

    const groups = createBalancedGroups(students, maxStudents, numMenus);
    res.json({ students, groups });
  } catch (error) {
    console.error('Erreur:', error);
    // Vérifier si c'est une erreur de capacité insuffisante
    if (error.message.includes('Capacité insuffisante')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

function extractNumber(str) {
  if (!str) return 0;
  const match = String(str).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseNoteWithActivity(str) {
  if (!str) return { activity: '', note: 0 };
  const str_trimmed = String(str).trim();
  const match = str_trimmed.match(/^(.+?)\s+([\d.]+)$/);
  if (match) {
    return {
      activity: match[1].trim(),
      note: parseFloat(match[2])
    };
  }
  // Si pas de format "Activité Nombre", essayer juste un nombre
  const numMatch = str_trimmed.match(/[\d.]+/);
  if (numMatch) {
    return {
      activity: '',
      note: parseFloat(numMatch[0])
    };
  }
  return { activity: '', note: 0 };
}

app.get('/api/demo-load', (req, res) => {
  try {
    const maxStudents = req.query.maxStudents ? parseInt(req.query.maxStudents) : null;
    const numMenus = req.query.numMenus ? parseInt(req.query.numMenus) : null;

    const filePath = './tests/test_normal_140.xlsx';
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const headers = Object.keys(data[0] || {});
    const findColumn = (pattern) => headers.find(h => h.includes(pattern));

    const prenomCol = findColumn('Prénom') || 'Prénom ';
    const nomCol = findColumn('Nom') || 'Nom';
    const classeCol = findColumn('Classe') && !findColumn('Classe').includes('menus') ? findColumn('Classe') : 'Classe ';
    const menusCol = findColumn('menus') || 'Classe les 5 menus obligatoires par ordre de préférence.';
    const note1Col = findColumn('premier trimestre') || 'Note au premier trimestre';
    const note2Col = findColumn('deuxième trimestre') || 'Note au deuxième trimestre';
    const note3Col = findColumn('troisième trimestre') || 'Note au troisième trimestre';

    const students = data.map((row, index) => {
      const menus = parseMenuChoices(row[menusCol] || '');
      if (menus.length === 0) return null;

      const note1Data = parseNoteWithActivity(row[note1Col]);
      const note2Data = parseNoteWithActivity(row[note2Col]);
      const note3Data = parseNoteWithActivity(row[note3Col]);

      return {
        id: index,
        nom: (row[nomCol] || '').trim(),
        prenom: (row[prenomCol] || '').trim(),
        classe: (row[classeCol] || '').trim(),
        menus,
        note1: note1Data.note,
        note1Activity: note1Data.activity,
        note2: note2Data.note,
        note2Activity: note2Data.activity,
        note3: note3Data.note,
        note3Activity: note3Data.activity
      };
    }).filter(s => s !== null);

    const groups = createBalancedGroups(students, maxStudents, numMenus);
    res.json({ students, groups });
  } catch (error) {
    console.error('Erreur:', error);
    // Vérifier si c'est une erreur de capacité insuffisante
    if (error.message.includes('Capacité insuffisante')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/export', (req, res) => {
  try {
    const { groups } = req.body;

    const wb = xlsx.utils.book_new();

    // Créer une feuille pour chaque menu
    Object.entries(groups).forEach(([groupKey, groupData]) => {
      const wsData = [
        ['Nom', 'Prénom', 'Classe'],
        ...groupData.members.map(m => [m.nom, m.prenom, m.classe])
      ];

      const ws = xlsx.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 10 }
      ];

      // Nommer l'onglet selon le menu
      const sheetName = `Menu ${groupData.letter}`;
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
    });

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
