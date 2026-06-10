let currentData = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const loadingMessage = document.getElementById('loadingMessage');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const groupsContainer = document.getElementById('groupsContainer');
const exportBtn = document.getElementById('exportBtn');
const newFileBtn = document.getElementById('newFileBtn');

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

  const formData = new FormData();
  formData.append('file', file);

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
  } catch (error) {
    showError(error.message);
  } finally {
    loadingMessage.classList.add('hidden');
  }
}

function displayResults() {
  const { students, groups } = currentData;

  // Mettre à jour les stats
  document.getElementById('studentCount').textContent = students.length;
  document.getElementById('groupCount').textContent = Object.keys(groups).length;
  const avgSize = (students.length / Object.keys(groups).length).toFixed(1);
  document.getElementById('avgGroupSize').textContent = avgSize;

  // Afficher les groupes
  groupsContainer.innerHTML = '';
  Object.entries(groups)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([activity, groupData]) => {
      const card = createGroupCard(activity, groupData);
      groupsContainer.appendChild(card);
    });

  // Afficher les résultats, cacher les erreurs
  resultsSection.classList.remove('hidden');
  errorSection.classList.add('hidden');
}

function createGroupCard(activity, groupData) {
  const card = document.createElement('div');
  card.className = 'group-card';

  const header = document.createElement('div');
  header.className = 'group-header';

  const title = document.createElement('div');
  title.className = 'group-title';
  title.textContent = groupData.name;

  const stats = document.createElement('div');
  stats.className = 'group-stats';
  stats.innerHTML = `
    <span>👥 ${groupData.count} étudiant${groupData.count > 1 ? 's' : ''}</span>
    <span>⭐ ${groupData.avgGrade}</span>
  `;

  header.appendChild(title);
  header.appendChild(stats);

  const body = document.createElement('div');
  body.className = 'group-body';

  const membersDiv = document.createElement('div');
  membersDiv.className = 'group-members';

  groupData.members.forEach(member => {
    const memberEl = document.createElement('div');
    memberEl.className = 'member';
    memberEl.innerHTML = `
      <div class="member-name">${member.prenom} ${member.nom}</div>
      <div class="member-info">
        ${member.classe}
        <span class="member-grade">${member.avgGrade}</span>
      </div>
    `;
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
  currentData = null;
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  groupsContainer.innerHTML = '';
});

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

// Demo mode (load sample data for testing)
if (window.location.search === '?demo') {
  window.addEventListener('load', () => {
    const demoData = {
      students: [
        { id: 0, nom: 'Le Pannerer', prenom: 'Ambroise', classe: 'TA', menus: [], note1: 12, note2: 12, note3: 14 },
        { id: 1, nom: 'dsq', prenom: 'dqs', classe: 'TC', menus: [], note1: 13, note2: 12, note3: 17 }
      ],
      groups: {
        'escalade': {
          name: 'Escalade',
          count: 1,
          avgGrade: '12.67',
          members: [
            { id: 0, nom: 'Le Pannerer', prenom: 'Ambroise', classe: 'TA', avgGrade: '12.67' }
          ],
          preferences: { 'Menu B': 1 }
        },
        'demi-fond': {
          name: 'Demi-fond',
          count: 1,
          avgGrade: '14.00',
          members: [
            { id: 1, nom: 'dsq', prenom: 'dqs', classe: 'TC', avgGrade: '14.00' }
          ],
          preferences: { 'Menu B': 1 }
        }
      }
    };
    currentData = demoData;
    displayResults();
  });
}
