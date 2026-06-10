function createBalancedGroups(students, maxStudentsPerGroup = null) {
  // Grouper les étudiants par leur premier choix de menu
  const groupedByMenu = {};
  students.forEach(student => {
    const firstMenuKey = student.menus[0]?.letter || 'UNKNOWN';
    if (!groupedByMenu[firstMenuKey]) {
      groupedByMenu[firstMenuKey] = [];
    }
    groupedByMenu[firstMenuKey].push(student);
  });

  // Créer un groupe par menu (avec ses 3 activités ENSEMBLE)
  const groupsResult = {};

  Object.entries(groupedByMenu).forEach(([menuLetter, studentsInMenu]) => {
    // Vérifier la limite max
    if (maxStudentsPerGroup && studentsInMenu.length > maxStudentsPerGroup) {
      return; // Skip ce groupe si dépassement
    }

    // Récupérer les 3 activités du menu
    const menuActivities = getMenuActivities(menuLetter, studentsInMenu);

    // Créer un groupe pour ce menu
    const groupKey = `menu-${menuLetter}`;

    // TOUS les étudiants du menu font TOUTES les 3 activités
    // Pas de séparation, pas de distribution
    groupsResult[groupKey] = {
      name: `Menu ${menuLetter}`,
      letter: menuLetter,
      activities: menuActivities.map(activity => formatActivityName(activity)),
      members: studentsInMenu.map(m => ({
        prenom: m.prenom,
        nom: m.nom,
        classe: m.classe,
        note1: m.note1,
        note2: m.note2,
        note3: m.note3
      })),
      count: studentsInMenu.length,
      preferences: getPreferencesDistribution(studentsInMenu)
    };
  });

  return groupsResult;
}

function getMenuActivities(menuLetter, students) {
  const activities = new Set();
  students.forEach(s => {
    const menu = s.menus.find(m => m.letter === menuLetter);
    if (menu) {
      menu.activities.forEach(a => activities.add(a.toLowerCase()));
    }
  });
  return Array.from(activities).sort();
}

function formatActivityName(activity) {
  return activity
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getPreferencesDistribution(members) {
  const dist = {};
  members.forEach(m => {
    const firstMenu = m.menus[0]?.letter || 'N/A';
    dist[`Menu ${firstMenu}`] = (dist[`Menu ${firstMenu}`] || 0) + 1;
  });
  return dist;
}

module.exports = { createBalancedGroups };
