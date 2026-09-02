let currentData = null;
let currentMember = null;
let currentGroupLetter = null;
let selectedNewGroup = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const loadingMessage = document.getElementById('loadingMessage');
const groupsLoadingMessage = document.getElementById('groupsLoadingMessage');
const configSection = document.getElementById('configSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const groupsContainer = document.getElementById('groupsContainer');
const exportBtn = document.getElementById('exportBtn');
const newFileBtn = document.getElementById('newFileBtn');
const maxStudentsInput = document.getElementById('maxStudents');
const createGroupsBtn = document.getElementById('createGroupsBtn');
const notesModal = document.getElementById('notesModal');
const justificationModal = document.getElementById('justificationModal');
const modalClose = document.querySelector('.modal-close');

let uploadedFile = null;

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

async function handleFile(file) {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    showError('Veuillez charger un fichier Excel (.xlsx ou .xls)');
    return;
  }

  loadingMessage.classList.remove('hidden');
  errorSection.classList.add('hidden');
  configSection.classList.add('hidden');

  uploadedFile = file;

  try {
    loadingMessage.textContent = '✅ Fichier chargé ! Configurez les groupes ci-dessous.';
    configSection.classList.remove('hidden');
    maxStudentsInput.focus();
  } catch (error) {
    showError(error.message);
  } finally {
    loadingMessage.classList.add('hidden');
  }
}

async function createGroups() {
  if (!uploadedFile) {
    showError('Veuillez d\'abord charger un fichier');
    return;
  }

  groupsLoadingMessage.classList.remove('hidden');
  errorSection.classList.add('hidden');

  const formData = new FormData();
  formData.append('file', uploadedFile);

  const maxStudents = maxStudentsInput.value;
  if (maxStudents) {
    formData.append('maxStudents', maxStudents);
  }

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du traitement du fichier');
    }

    currentData = await response.json();
    displayResults();
    configSection.classList.add('hidden');
  } catch (error) {
    showError(error.message);
  } finally {
    groupsLoadingMessage.classList.add('hidden');
  }
}

function displayResults() {
  const { students, groups } = currentData;

  // Mettre à jour les stats
  document.getElementById('studentCount').textContent = students.length;
  const groupsCount = Object.keys(groups).length;
  document.getElementById('groupCount').textContent = groupsCount;
  const avgSize = groupsCount > 0
    ? (students.length / groupsCount).toFixed(1)
    : 0;
  document.getElementById('avgGroupSize').textContent = avgSize;

  // Afficher les statistiques brutes
  displayRawStats(students);

  // Afficher les groupes (par menu)
  groupsContainer.innerHTML = '';
  Object.entries(groups)
    .sort((a, b) => {
      // Trier par lettre de menu (A, B, C, D, E)
      const letterA = a[1].letter || '';
      const letterB = b[1].letter || '';
      return letterA.localeCompare(letterB);
    })
    .forEach(([groupKey, groupData]) => {
      const card = createGroupCard(groupKey, groupData);
      groupsContainer.appendChild(card);
    });

  // Afficher les résultats, cacher les erreurs
  resultsSection.classList.remove('hidden');
  errorSection.classList.add('hidden');
}

function displayRawStats(students) {
  // Compter les choix par menu et par ordre de préférence
  const stats = {};
  const menus = ['A', 'B', 'C', 'D', 'E'];

  // Initialiser la structure
  menus.forEach(menu => {
    stats[menu] = {};
    for (let i = 1; i <= 5; i++) {
      stats[menu][i] = 0;
    }
  });

  // Compter les choix
  students.forEach(student => {
    if (student.menus && Array.isArray(student.menus)) {
      student.menus.forEach(menu => {
        const letter = menu.letter;
        const order = menu.order;
        if (stats[letter] !== undefined) {
          stats[letter][order]++;
        }
      });
    }
  });

  // Créer le tableau HTML
  const table = document.createElement('table');
  table.className = 'stats-table';

  // En-tête
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Menu</th><th>1ère Choix</th><th>2ème Choix</th><th>3ème Choix</th><th>4ème Choix</th><th>5ème Choix</th><th>Total</th>';
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Corps du tableau
  const tbody = document.createElement('tbody');
  menus.forEach(menu => {
    const row = document.createElement('tr');
    let total = 0;

    let html = `<td class="menu-label">Menu ${menu}</td>`;
    for (let i = 1; i <= 5; i++) {
      const count = stats[menu][i] || 0;
      total += count;
      html += `<td><span class="choice-count">${count}</span></td>`;
    }
    html += `<td style="font-weight: 600; color: #667eea;">${total}</td>`;

    row.innerHTML = html;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  const rawStatsTable = document.getElementById('rawStatsTable');
  rawStatsTable.innerHTML = '';
  rawStatsTable.appendChild(table);
}

function createGroupCard(groupKey, groupData) {
  const card = document.createElement('div');
  card.className = 'group-card';

  const header = document.createElement('div');
  header.className = 'group-header';

  const title = document.createElement('div');
  title.className = 'group-title';
  title.textContent = groupData.name;

  const activities = document.createElement('div');
  activities.className = 'group-activities';
  activities.innerHTML = `<strong>Activités :</strong> ${groupData.activities.join(' • ')}`;

  const stats = document.createElement('div');
  stats.className = 'group-stats';
  stats.innerHTML = `<span>👥 ${groupData.count} étudiant${groupData.count > 1 ? 's' : ''}</span>`;

  header.appendChild(title);
  header.appendChild(activities);
  header.appendChild(stats);

  const body = document.createElement('div');
  body.className = 'group-body';

  // Afficher la liste de TOUS les étudiants du menu
  const membersDiv = document.createElement('div');
  membersDiv.className = 'group-members';

  groupData.members.forEach(member => {
    const memberEl = document.createElement('div');
    memberEl.className = 'member';
    const chosenOrderText = member.chosenMenuOrder === 1 ? '1ère préférence' : `${member.chosenMenuOrder}ème choix`;
    memberEl.innerHTML = `
      <div class="member-name">${member.prenom} ${member.nom} <span style="color: #667eea; font-size: 0.85em; font-weight: 500;">(${chosenOrderText})</span></div>
      <div class="member-info">${member.classe}</div>
    `;
    memberEl.addEventListener('click', () => showNotesModal(member, groupData.letter));
    membersDiv.appendChild(memberEl);
  });

  const prefsDiv = document.createElement('div');
  prefsDiv.className = 'preferences';
  prefsDiv.innerHTML = '<strong>Préférences :</strong>' +
    Object.entries(groupData.preferences)
      .map(([menu, count]) => `<div class="preference-item">${menu}: ${count}</div>`)
      .join('');

  body.appendChild(membersDiv);
  body.appendChild(prefsDiv);

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

function showNotesModal(member, groupLetter) {
  currentMember = member;
  currentGroupLetter = groupLetter;
  selectedNewGroup = null;

  document.getElementById('modalTitle').textContent = `Notes de ${member.prenom} ${member.nom}`;

  const formatNote = (note, activity) => {
    if (!activity) return note;
    return `${activity} ${note}`;
  };

  document.getElementById('note1Value').textContent = formatNote(member.note1, member.note1Activity);
  document.getElementById('note2Value').textContent = formatNote(member.note2, member.note2Activity);
  document.getElementById('note3Value').textContent = formatNote(member.note3, member.note3Activity);

  // Afficher les préférences
  const preferencesList = document.getElementById('preferencesList');
  preferencesList.innerHTML = '';

  if (member.allMenus && Array.isArray(member.allMenus)) {
    member.allMenus.forEach(menu => {
      const prefEl = document.createElement('div');
      prefEl.className = `preference-choice ${menu.order === member.chosenMenuOrder ? 'chosen' : ''}`;
      const orderText = menu.order === 1 ? '1ère' : `${menu.order}ème`;
      prefEl.innerHTML = `
        <span class="preference-order">${orderText} choix:</span> Menu ${menu.letter}
      `;
      preferencesList.appendChild(prefEl);
    });
  }

  // Afficher le bouton justification pour TOUS
  const justBtn = document.getElementById('showJustificationBtn');
  justBtn.style.display = 'block';

  notesModal.classList.remove('hidden');
}

function showError(message) {
  errorMessage.textContent = message;
  errorSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
}

exportBtn.addEventListener('click', async () => {
  if (!currentData) return;

  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData)
    });

    if (!response.ok) throw new Error('Erreur lors de l\'export');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groupes_equilibres_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    showError('Erreur lors de l\'export: ' + error.message);
  }
});

newFileBtn.addEventListener('click', () => {
  fileInput.value = '';
  uploadedFile = null;
  currentData = null;
  maxStudentsInput.value = '';
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  configSection.classList.add('hidden');
  groupsContainer.innerHTML = '';
});

createGroupsBtn.addEventListener('click', createGroups);

// Charger les données démo du serveur (140 étudiants)
async function loadDemoDataFromServer() {
  loadingMessage.classList.remove('hidden');
  errorSection.classList.add('hidden');

  try {
    const response = await fetch('/api/demo-load');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du chargement des données');
    }

    currentData = await response.json();
    displayResults();
  } catch (error) {
    showError(error.message);
  } finally {
    loadingMessage.classList.add('hidden');
  }
}

// Si mode démo avec données serveur
if (window.location.search === '?demo-data') {
  window.addEventListener('load', loadDemoDataFromServer);
}

function showJustificationModal(member) {
  const rebasculage = member.rebasculage;

  document.getElementById('justificationTitle').textContent = `Justification - ${member.prenom} ${member.nom}`;

  const menuActivities = {
    'A': ['Demi-fond', 'Escalade', 'Badminton'],
    'B': ['Escalade', 'Volley-ball', 'Demi-fond'],
    'C': ['Danse', 'Natation', 'Step'],
    'D': ['Volley-ball', 'Danse', 'Natation'],
    'E': ['Foot', 'Musculation', 'Demi-fond']
  };

  let html = '';

  if (rebasculage && rebasculage.wasRebasculé) {
    // Cas 1 : Étudiant rebasculé
    const reason = rebasculage.reason;
    const fromActivities = menuActivities[reason.fromMenu] || [];
    const toActivities = menuActivities[reason.toMenu] || [];
    const commonActivities = fromActivities.filter(a =>
      toActivities.some(b => a.toLowerCase() === b.toLowerCase())
    );

    html = `
      <div class="justification-section">
        <h3>📌 Votre situation</h3>
        <div class="justification-item">
          <strong>Classe :</strong> ${member.classe}<br>
          <strong>1ère choix :</strong> Menu ${reason.fromMenu}<br>
          <strong>Placement final :</strong> Menu ${reason.toMenu}
          <span class="status-badge status-rebasculé">Rebasculé</span>
        </div>
      </div>

      <div class="justification-section">
        <h3>🔴 Pourquoi ce rebasculage ?</h3>
        <div class="justification-item">
          Le Menu ${reason.fromMenu} a reçu <strong>${reason.surplusDemand} demandes</strong> pour <strong>${reason.targetSize} places</strong>.
          <br><br>
          <strong>Surplus :</strong> ${reason.surplusDemand - reason.targetSize} étudiant(s) à rebasculer
        </div>
      </div>

      <div class="justification-section">
        <h3>✅ Analyse de votre cas</h3>
        <div class="justification-item highlight">
          <strong>Compatibilité avec Menu ${reason.toMenu} :</strong><br><br>
          Activités conservées : <span class="compatibility-score">${commonActivities.length}/3 = ${reason.compatibilityPercent}%</span>
        </div>
        <div style="padding: 12px; font-size: 0.9em; color: #555;">
          ${commonActivities.map(a => `✓ ${a} (conservé)`).join('<br>')}
          ${toActivities.filter(a => !commonActivities.some(b => a.toLowerCase() === b.toLowerCase())).map((a, i) => {
            const replaced = fromActivities[i];
            return `<br>↔ ${replaced} → ${a} (changement)`;
          }).join('')}
        </div>
      </div>

      <div class="justification-section">
        <h3>📋 Pourquoi Menu ${reason.toMenu} ?</h3>
        <div class="justification-item">
          Vous avez ${reason.compatibilityPercent}% de vos activités préférées conservées.
          <br><br>
          C'est le meilleur compromis possible pour :
          <br>✓ Respecter votre 2ème choix
          <br>✓ Garder un maximum de vos activités préférées
          <br>✓ Équilibrer tous les groupes (${reason.targetSize} étudiants par menu)
        </div>
      </div>

      <div class="justification-section">
        <h3>🎯 Résultat final</h3>
        <div class="justification-item">
          <strong>Menu affecté :</strong> ${reason.toMenu}<br>
          <strong>Activités :</strong> ${toActivities.join(' + ')}<br>
          <strong>Groupe :</strong> 28 étudiants
        </div>
      </div>
    `;
  } else {
    // Cas 2 : Étudiant à sa 1ère préférence
    const finalMenuLetter = member.allMenus[member.chosenMenuOrder - 1]?.letter;
    const finalActivities = menuActivities[finalMenuLetter] || [];

    html = `
      <div class="justification-section">
        <h3>📌 Votre situation</h3>
        <div class="justification-item">
          <strong>Classe :</strong> ${member.classe}<br>
          <strong>1ère choix :</strong> Menu ${finalMenuLetter}<br>
          <strong>Placement final :</strong> Menu ${finalMenuLetter}
          <span class="status-badge status-ok">Accepté ✓</span>
        </div>
      </div>

      <div class="justification-section">
        <h3>✅ Excellentes nouvelles !</h3>
        <div class="justification-item highlight">
          <strong>Vous avez obtenu votre 1ère choix ! 🎉</strong><br><br>
          Menu ${finalMenuLetter} avait suffisamment de places pour vous.
          Vous pouvez faire les activités que vous aviez demandées en priorité.
        </div>
      </div>

      <div class="justification-section">
        <h3>🎯 Vos activités</h3>
        <div class="justification-item">
          <strong>Menu :</strong> ${finalMenuLetter}<br>
          <strong>Activités :</strong> ${finalActivities.join(' + ')}<br>
          <strong>Groupe :</strong> 28 étudiants
        </div>
      </div>

      <div class="justification-section">
        <h3>📊 Comment ça a marché</h3>
        <div class="justification-item">
          ✓ Votre 1ère préférence avait de la place<br>
          ✓ L'algorithme a pu respecter votre choix<br>
          ✓ Les groupes restent équilibrés (28 étudiants par menu)<br>
          <br>
          <strong>Résultat :</strong> Vous êtes exactement où vous le souhaitiez !
        </div>
      </div>
    `;
  }

  document.getElementById('justificationContent').innerHTML = html;
  notesModal.classList.add('hidden');
  justificationModal.classList.remove('hidden');
}

function showChangeGroupModal() {
  if (!currentMember || !currentGroupLetter) return;

  const changeGroupModal = document.getElementById('changeGroupModal');
  const groupOptions = document.getElementById('groupOptions');
  const changeGroupInfo = document.getElementById('changeGroupInfo');

  // Afficher les infos
  changeGroupInfo.textContent = `${currentMember.prenom} ${currentMember.nom} est actuellement au Menu ${currentGroupLetter}. Choisissez un nouveau groupe:`;

  // Créer les options de groupe
  groupOptions.innerHTML = '';
  const menuLetters = ['A', 'B', 'C', 'D', 'E'];

  menuLetters.forEach(letter => {
    const group = currentData.groups[`menu-${letter}`];
    if (!group) return;

    const option = document.createElement('div');
    option.className = 'group-option';
    // Pré-sélectionner le groupe actuel
    if (letter === currentGroupLetter) {
      option.classList.add('selected');
      selectedNewGroup = letter;
    }

    option.innerHTML = `
      <div class="group-option-header">📋 Menu ${letter}</div>
      <div class="group-option-activities">${group.activities.join(' • ')}</div>
      <div class="group-option-count">👥 ${group.count} étudiants</div>
    `;

    option.addEventListener('click', () => {
      document.querySelectorAll('.group-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedNewGroup = letter;
    });

    groupOptions.appendChild(option);
  });

  notesModal.classList.add('hidden');
  changeGroupModal.classList.remove('hidden');
}

function confirmChangeGroup() {
  if (!selectedNewGroup || !currentMember || !currentGroupLetter) return;

  if (selectedNewGroup === currentGroupLetter) {
    alert('Veuillez choisir un groupe différent');
    return;
  }

  // Déplacer l'étudiant
  const oldGroup = currentData.groups[`menu-${currentGroupLetter}`];
  const newGroup = currentData.groups[`menu-${selectedNewGroup}`];

  // Retirer de l'ancien groupe
  oldGroup.members = oldGroup.members.filter(m => m !== currentMember);
  oldGroup.count = oldGroup.members.length;

  // Ajouter au nouveau groupe
  newGroup.members.push(currentMember);
  newGroup.count = newGroup.members.length;

  // Fermer le modal et réafficher
  document.getElementById('changeGroupModal').classList.add('hidden');
  displayResults();

  alert(`${currentMember.prenom} ${currentMember.nom} a été déplacé(e) au Menu ${selectedNewGroup}`);
}

// Modal controls
const allModalCloses = document.querySelectorAll('.modal-close');
allModalCloses.forEach(close => {
  close.addEventListener('click', () => {
    notesModal.classList.add('hidden');
    justificationModal.classList.add('hidden');
    document.getElementById('changeGroupModal').classList.add('hidden');
  });
});

notesModal.addEventListener('click', (e) => {
  if (e.target === notesModal) {
    notesModal.classList.add('hidden');
  }
});

justificationModal.addEventListener('click', (e) => {
  if (e.target === justificationModal) {
    justificationModal.classList.add('hidden');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const showJustBtn = document.getElementById('showJustificationBtn');
  if (showJustBtn) {
    showJustBtn.addEventListener('click', () => {
      if (currentMember) {
        showJustificationModal(currentMember);
      }
    });
  }

  const changeGroupBtn = document.getElementById('changeGroupBtn');
  if (changeGroupBtn) {
    changeGroupBtn.addEventListener('click', showChangeGroupModal);
  }

  const confirmChangeBtn = document.getElementById('confirmChangeBtn');
  if (confirmChangeBtn) {
    confirmChangeBtn.addEventListener('click', confirmChangeGroup);
  }

  const changeGroupModal = document.getElementById('changeGroupModal');
  if (changeGroupModal) {
    changeGroupModal.addEventListener('click', (e) => {
      if (e.target === changeGroupModal) {
        changeGroupModal.classList.add('hidden');
      }
    });
  }
});

// Charger les données démo du serveur (140 étudiants)
async function loadDemoDataFromServer() {
  loadingMessage.classList.remove('hidden');
  errorSection.classList.add('hidden');

  const maxStudents = maxStudentsInput.value;
  const url = '/api/demo-load' + (maxStudents ? `?maxStudents=${maxStudents}` : '');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du chargement des données');
    }

    currentData = await response.json();
    displayResults();
  } catch (error) {
    showError(error.message);
  } finally {
    loadingMessage.classList.add('hidden');
  }
}

// Si mode démo avec données serveur
if (window.location.search === '?demo-data') {
  window.addEventListener('load', loadDemoDataFromServer);
}
