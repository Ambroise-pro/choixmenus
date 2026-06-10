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

  // Créer un groupe par menu (avec ses 3 activités)
  const groupsResult = {};

  Object.entries(groupedByMenu).forEach(([menuLetter, studentsInMenu]) => {
    // Récupérer les 3 activités du menu
    const menuActivities = getMenuActivities(menuLetter, studentsInMenu);

    // Créer un groupe pour ce menu
    const groupKey = `menu-${menuLetter}`;

    // Distribuer les étudiants entre les 3 activités du menu
    const activitiesData = {};
    menuActivities.forEach(activity => {
      activitiesData[activity] = [];
    });

    // Distribution round-robin des étudiants entre les activités
    studentsInMenu.forEach((student, index) => {
      if (menuActivities.length > 0) {
        // Trouver l'activité avec le moins d'étudiants
        const sortedActivities = menuActivities.sort((a, b) =>
          activitiesData[a].length - activitiesData[b].length
        );
        const activity = sortedActivities[0];

        // Vérifier la limite max si elle existe
        if (!maxStudentsPerGroup || activitiesData[activity].length < maxStudentsPerGroup) {
          activitiesData[activity].push({
            activity: formatActivityName(activity),
            prenom: student.prenom,
            nom: student.nom,
            classe: student.classe,
            note1: student.note1,
            note2: student.note2,
            note3: student.note3
          });
        }
      }
    });

    // Créer l'objet du groupe avec ses 3 activités
    groupsResult[groupKey] = {
      name: `Menu ${menuLetter}`,
      letter: menuLetter,
      activities: menuActivities.map(activity => ({
        name: formatActivityName(activity),
        key: activity,
        members: activitiesData[activity]
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
