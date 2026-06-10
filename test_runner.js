const { createBalancedGroups } = require('./algorithm');
const xlsx = require('xlsx');
const fs = require('fs');

function parseMenuChoices(text) {
  if (!text || typeof text !== 'string') return [];
  const menus = [];
  const menuPattern = /Menu\s+([A-E])\s*:\s*([^;]+)/gi;
  let match;
  while ((match = menuPattern.exec(text)) !== null) {
    const letter = match[1];
    const activities = match[2].split('/').map(a => a.trim());
    menus.push({ letter, activities, order: menus.length + 1 });
  }
  return menus;
}

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
    return { activity: match[1].trim(), note: parseFloat(match[2]) };
  }
  const numMatch = str_trimmed.match(/[\d.]+/);
  if (numMatch) {
    return { activity: '', note: parseFloat(numMatch[0]) };
  }
  return { activity: '', note: 0 };
}

function runTest(filename, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${testName}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const fileBuffer = fs.readFileSync(filename);
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

    const students = data.map((row, index) => {
      const menus = parseMenuChoices(row[menusCol] || '');
      if (menus.length === 0) return null;

      return {
        id: index,
        nom: (row[nomCol] || '').trim(),
        prenom: (row[prenomCol] || '').trim(),
        classe: (row[classeCol] || '').trim(),
        menus,
        note1: 0,
        note2: 0,
        note3: 0
      };
    }).filter(s => s !== null);

    console.log(`\n📊 Résultats :`);
    console.log(`   • Total étudiants : ${students.length}`);

    if (students.length === 0) {
      console.log(`   ⚠️  ERREUR : Aucun étudiant trouvé !`);
      return;
    }

    // Analyser les préférences avant distribution
    const prefsCount = {};
    students.forEach(s => {
      const firstMenu = s.menus[0]?.letter;
      prefsCount[firstMenu] = (prefsCount[firstMenu] || 0) + 1;
    });

    console.log(`\n   Demandes 1ère choix :`);
    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
      const count = prefsCount[letter] || 0;
      const pct = ((count / students.length) * 100).toFixed(1);
      console.log(`   • Menu ${letter}: ${count} (${pct}%)`);
    });

    // Exécuter l'algorithme
    const groups = createBalancedGroups(students, null);
    const groupsArray = Object.values(groups);

    console.log(`\n   Groupes créés : ${groupsArray.length}`);

    if (groupsArray.length === 0) {
      console.log(`   ⚠️  ERREUR : Aucun groupe créé !`);
      return;
    }

    let totalAssigned = 0;
    const minSize = Math.min(...groupsArray.map(g => g.count));
    const maxSize = Math.max(...groupsArray.map(g => g.count));
    const avgSize = (students.length / groupsArray.length).toFixed(2);

    console.log(`\n   Distribution :`);
    groupsArray.sort((a, b) => a.letter.localeCompare(b.letter)).forEach(group => {
      totalAssigned += group.count;
      const prefs = Object.entries(group.preferences)
        .map(([menu, count]) => `${menu}:${count}`)
        .join(', ');
      console.log(`   • Menu ${group.letter}: ${group.count} étudiants (Prefs: ${prefs})`);
    });

    console.log(`\n   Statistiques :`);
    console.log(`   • Min: ${minSize}, Max: ${maxSize}, Avg: ${avgSize}`);
    console.log(`   • Total assigné: ${totalAssigned}/${students.length}`);

    if (totalAssigned !== students.length) {
      console.log(`   ⚠️  ALERTE : ${students.length - totalAssigned} étudiants non assignés !`);
    }

    if (maxSize - minSize > 2) {
      console.log(`   ⚠️  ALERTE : Déséquilibre détecté (différence de ${maxSize - minSize})`);
    }

    if (groupsArray.length < 5) {
      console.log(`   ⚠️  ALERTE : Seulement ${groupsArray.length}/5 groupes créés`);
    }

    console.log(`\n✅ Test complété`);

  } catch (error) {
    console.log(`\n❌ ERREUR : ${error.message}`);
    console.log(error.stack);
  }
}

// Exécuter tous les tests
console.log(`\n🚀 BATTERIE DE TESTS - VALIDATION DE L'ALGORITHME\n`);

const tests = [
  ['./tests/test_normal_140.xlsx', 'Test 1: Normal (140 étudiants)'],
  ['./tests/test_few_10.xlsx', 'Test 2: Cas extrême (10 étudiants)'],
  ['./tests/test_143.xlsx', 'Test 3: Non divisible (143 étudiants)'],
  ['./tests/test_all_same.xlsx', 'Test 4: Tous veulent Menu A'],
  ['./tests/test_unequal.xlsx', 'Test 5: Distribution inégale'],
  ['./tests/test_one_per_menu.xlsx', 'Test 6: Minimal (5 étudiants)'],
  ['./tests/test_same_prefs.xlsx', 'Test 7: Préférences identiques']
];

tests.forEach(([file, name]) => {
  if (fs.existsSync(file)) {
    runTest(file, name);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ TESTS TERMINÉS`);
console.log(`${'='.repeat(60)}\n`);
