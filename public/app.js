let currentData = null;

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
    memberEl.addEventListener('click', () => showNotesModal(member));
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

function showNotesModal(member) {
  document.getElementById('modalTitle').textContent = `Notes de ${member.prenom} ${member.nom}`;
  document.getElementById('note1Value').textContent = member.note1;
  document.getElementById('note2Value').textContent = member.note2;
  document.getElementById('note3Value').textContent = member.note3;

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

// Modal controls
modalClose.addEventListener('click', () => notesModal.classList.add('hidden'));
notesModal.addEventListener('click', (e) => {
  if (e.target === notesModal) {
    notesModal.classList.add('hidden');
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
