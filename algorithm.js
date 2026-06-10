function createBalancedGroups(students, maxStudentsPerGroup = null) {
  // Extraire tous les menus/activités uniques
  const activities = new Set();
  students.forEach(s => {
    s.menus.forEach(m => {
      m.activities.forEach(a => activities.add(a.toLowerCase()));
    });
  });

  const activityList = Array.from(activities).sort();

  // Grouper les étudiants par leur premier choix de menu
  const groupedByFirstChoice = {};
  students.forEach(student => {
    const firstMenuKey = student.menus[0]?.letter || 'UNKNOWN';
    if (!groupedByFirstChoice[firstMenuKey]) {
      groupedByFirstChoice[firstMenuKey] = [];
    }
    groupedByFirstChoice[firstMenuKey].push(student);
  });

  // Créer les groupes pour chaque activité
  const groups = {};
  activityList.forEach(activity => {
    groups[activity] = [];
  });

  // Distribuer les étudiants de manière équilibrée
  const sortedGroups = Object.entries(groupedByFirstChoice)
    .sort((a, b) => b[1].length - a[1].length);

  // Pour chaque groupe de premier choix, distribuer les étudiants
  sortedGroups.forEach(([menuLetter, studentsInGroup]) => {
    // Distribuer dans les activités du menu correspondant
    const menuActivities = getMenuActivities(menuLetter, studentsInGroup);

    // Distribuer de manière round-robin
    let activityIndex = 0;
    studentsInGroup.forEach((student) => {
      if (menuActivities.length > 0) {
        // Trouver le groupe avec le moins d'étudiants
        const sortedActivities = menuActivities.sort((a, b) =>
          groups[a].length - groups[b].length
        );
        const activity = sortedActivities[0];

        // Vérifier la limite max si elle existe
        if (!maxStudentsPerGroup || groups[activity].length < maxStudentsPerGroup) {
          groups[activity].push({
            ...student,
            assignedActivity: activity,
            assignedMenu: menuLetter
          });
        }
      }
    });
  });

  // Convertir en format lisible (SANS moyennes)
  const groupsResult = {};
  Object.entries(groups).forEach(([activity, members]) => {
    groupsResult[activity] = {
      name: formatActivityName(activity),
      members: members.map(m => ({
        id: m.id,
        nom: m.nom,
        prenom: m.prenom,
        classe: m.classe,
        note1: m.note1,
        note2: m.note2,
        note3: m.note3
      })),
      count: members.length,
      preferences: getPreferencesDistribution(members)
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
