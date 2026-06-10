function createBalancedGroups(students) {
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
    // Trier les étudiants par note moyenne (pour équilibrer aussi les niveaux)
    studentsInGroup.sort((a, b) => {
      const avgA = (a.note1 + a.note2 + a.note3) / 3;
      const avgB = (b.note1 + b.note2 + b.note3) / 3;
      return avgB - avgA;
    });

    // Distribuer dans les activités du menu correspondant
    const menuActivities = getMenuActivities(menuLetter, studentsInGroup);

    // Distribuer de manière round-robin
    studentsInGroup.forEach((student, index) => {
      if (menuActivities.length > 0) {
        const activityIndex = index % menuActivities.length;
        const activity = menuActivities[activityIndex];
        groups[activity].push({
          ...student,
          assignedActivity: activity,
          assignedMenu: menuLetter
        });
      }
    });
  });

  // Convertir en format lisible avec statistiques
  const groupsResult = {};
  Object.entries(groups).forEach(([activity, members]) => {
    const avgNote = members.length > 0
      ? (members.reduce((sum, s) => sum + (s.note1 + s.note2 + s.note3) / 3, 0) / members.length).toFixed(2)
      : 0;

    groupsResult[activity] = {
      name: formatActivityName(activity),
      members: members.map(m => ({
        id: m.id,
        nom: m.nom,
        prenom: m.prenom,
        classe: m.classe,
        avgGrade: ((m.note1 + m.note2 + m.note3) / 3).toFixed(2)
      })),
      count: members.length,
      avgGrade: avgNote,
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
