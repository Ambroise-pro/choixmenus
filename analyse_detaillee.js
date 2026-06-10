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

function analyzeTest(filename, testName) {
  console.log(`\n${'█'.repeat(70)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'█'.repeat(70)}\n`);

  try {
    const fileBuffer = fs.readFileSync(filename);
    const workbook = xlsx.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const headers = Object.keys(data[0] || {});
    const findColumn = (pattern) => headers.find(h => h.includes(pattern));
    const menusCol = findColumn('menus') || 'Classe les 5 menus obligatoires par ordre de préférence.';

    const students = data.map((row, index) => {
      const menus = parseMenuChoices(row[menusCol] || '');
      if (menus.length === 0) return null;
      return { id: index, menus };
    }).filter(s => s !== null);

    const total = students.length;
    const target = Math.floor(total / 5);

    console.log(`📋 CONFIGURATION:`);
    console.log(`   • Total étudiants: ${total}`);
    console.log(`   • Cible par menu: ${target}`);
    console.log(`   • Distribution mathématique: ${total} ÷ 5 = ${(total/5).toFixed(2)} par menu\n`);

    // Analyser les demandes 1ère choix
    const demand = {};
    ['A', 'B', 'C', 'D', 'E'].forEach(l => demand[l] = 0);
    students.forEach(s => {
      const first = s.menus[0]?.letter;
      if (first) demand[first]++;
    });

    console.log(`📊 DEMANDES 1ère CHOIX:`);
    const sorted = Object.entries(demand).sort((a,b) => b[1] - a[1]);
    sorted.forEach(([menu, count]) => {
      const pct = ((count/total)*100).toFixed(1);
      const surplus = count - target;
      if (surplus > 0) {
        console.log(`   • Menu ${menu}: ${count} demandes (${pct}%) → SURPLUS de ${surplus}`);
      } else if (surplus < 0) {
        console.log(`   • Menu ${menu}: ${count} demandes (${pct}%) → DÉFICIT de ${-surplus}`);
      } else {
        console.log(`   • Menu ${menu}: ${count} demandes (${pct}%) → ÉQUILIBRÉ ✓`);
      }
    });

    // Exécuter l'algorithme
    const groups = createBalancedGroups(students, null);
    const groupsArray = Object.values(groups);

    console.log(`\n🎯 RÉSULTATS DE DISTRIBUTION:`);
    console.log(`   • Groupes créés: ${groupsArray.length}/5`);

    if (groupsArray.length !== 5) {
      console.log(`   ⚠️  ALERTE: Seulement ${groupsArray.length}/5 groupes créés!\n`);
    }

    const sizes = {};
    groupsArray.forEach(g => {
      sizes[g.letter] = g.count;
    });

    ['A', 'B', 'C', 'D', 'E'].forEach(l => {
      const size = sizes[l] || 0;
      const diff = size - target;
      const status = size === 0 ? '❌ VIDE' : (Math.abs(diff) <= 1 ? '✅' : '⚠️ ');
      if (size === 0) {
        console.log(`   ${status} Menu ${l}: 0/${target} (GROUP NON CRÉÉ)`);
      } else {
        console.log(`   ${status} Menu ${l}: ${size}/${target} (${diff > 0 ? '+' : ''}${diff})`);
      }
    });

    const minSize = Math.min(...groupsArray.map(g => g.count));
    const maxSize = Math.max(...groupsArray.map(g => g.count));
    const totalAssigned = groupsArray.reduce((sum, g) => sum + g.count, 0);
    const equilibre = maxSize - minSize;

    console.log(`\n📈 ANALYSE ÉQUILIBRE:`);
    console.log(`   • Total assigné: ${totalAssigned}/${total} ${totalAssigned === total ? '✅' : '❌'}`);
    console.log(`   • Min-Max: ${minSize} à ${maxSize} (écart: ${equilibre})`);
    console.log(`   • Équilibre acceptable? ${equilibre <= 2 ? '✅ OUI' : '⚠️  NON (écart > 2)'}`);

    if (total > 5 && groupsArray.length === 5) {
      const avgExpected = (total / 5).toFixed(2);
      const deviations = groupsArray.map(g => Math.abs(g.count - avgExpected));
      const avgDeviation = (deviations.reduce((a,b) => a+b) / 5).toFixed(2);
      console.log(`   • Déviation moyenne: ±${avgDeviation} (acceptable < 1)`);
    }

    // Analyser les rebasculages
    console.log(`\n🔄 ANALYSE REBASCULAGES:`);
    const rebasculages = {};
    groupsArray.forEach(group => {
      group.preferences = group.preferences || {};
      Object.entries(group.preferences).forEach(([menu, count]) => {
        if (!menu.includes(group.letter)) {
          const fromLetter = menu.split(' ')[1];
          if (fromLetter !== group.letter) {
            const key = `${fromLetter}→${group.letter}`;
            rebasculages[key] = (rebasculages[key] || 0) + count;
          }
        }
      });
    });

    if (Object.keys(rebasculages).length === 0) {
      console.log(`   • Aucun rebasculage (tous à leur 1er choix) ✅`);
    } else {
      const sorted = Object.entries(rebasculages).sort((a,b) => b[1] - a[1]);
      sorted.forEach(([flow, count]) => {
        console.log(`   • ${flow}: ${count} étudiant(s) rebasculé(s)`);
      });
      const totalRebasculé = Object.values(rebasculages).reduce((a,b) => a+b, 0);
      const pctRebasculé = ((totalRebasculé/total)*100).toFixed(1);
      console.log(`   • Total rebasculé: ${totalRebasculé}/${total} (${pctRebasculé}%)`);
    }

    // Verdict
    console.log(`\n⚖️  VERDICT:`);
    const issues = [];
    if (groupsArray.length < 5) issues.push(`Seulement ${groupsArray.length}/5 groupes créés`);
    if (equilibre > 5) issues.push(`Déséquilibre important (écart ${equilibre})`);
    if (totalAssigned !== total) issues.push(`${total - totalAssigned} étudiants non assignés`);

    if (issues.length === 0) {
      console.log(`   ✅ TEST RÉUSSI`);
    } else {
      console.log(`   ❌ PROBLÈMES DÉTECTÉS:`);
      issues.forEach(issue => console.log(`      • ${issue}`));
    }

  } catch (error) {
    console.log(`❌ ERREUR: ${error.message}`);
  }
}

console.log(`\n🔬 ANALYSE DÉTAILLÉE - BATTERIE DE 7 TESTS\n`);

const tests = [
  ['./tests/test_normal_140.xlsx', 'Test 1: Normal (140 étudiants)'],
  ['./tests/test_few_10.xlsx', 'Test 2: Très peu d\'étudiants (10)'],
  ['./tests/test_143.xlsx', 'Test 3: Non divisible par 5 (143)'],
  ['./tests/test_all_same.xlsx', 'Test 4: EXTRÊME - Tous veulent Menu A (140)'],
  ['./tests/test_unequal.xlsx', 'Test 5: Distribution inégale (50% Menu A)'],
  ['./tests/test_one_per_menu.xlsx', 'Test 6: Minimal (1 par menu = 5)'],
  ['./tests/test_same_prefs.xlsx', 'Test 7: Préférences identiques (28 par menu)']
];

tests.forEach(([file, name]) => {
  if (fs.existsSync(file)) {
    analyzeTest(file, name);
  }
});

console.log(`\n${'█'.repeat(70)}\n`);
