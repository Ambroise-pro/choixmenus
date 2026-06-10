function createBalancedGroups(students, maxStudentsPerGroup = null) {
  const menus = ['A', 'B', 'C', 'D', 'E'];
  const targetSize = Math.floor(students.length / menus.length);
  const groupsResult = {};

  // Initialiser les groupes vides
  menus.forEach(letter => {
    groupsResult[`menu-${letter}`] = {
      letter,
      members: [],
      studentObjects: []
    };
  });

  // Pour chaque niveau de préférence (1 à 5)
  for (let preferenceLevel = 1; preferenceLevel <= 5; preferenceLevel++) {
    // Chercher les étudiants non assignés et trier par leur préférence actuelle
    const unassigned = students.filter(s => !s.assigned);

    // Grouper les non-assignés par leur préférence à ce niveau
    const byPreference = {};
    unassigned.forEach(student => {
      if (student.menus[preferenceLevel - 1]) {
        const letter = student.menus[preferenceLevel - 1].letter;
        if (!byPreference[letter]) byPreference[letter] = [];
        byPreference[letter].push(student);
      }
    });

    // Ajouter les étudiants aux groupes, priorité aux groupes non complets
    Object.entries(byPreference).forEach(([letter, studentsForThisMenu]) => {
      studentsForThisMenu.forEach(student => {
        if (!student.assigned && groupsResult[`menu-${letter}`].members.length < targetSize) {
          groupsResult[`menu-${letter}`].members.push(letter);
          groupsResult[`menu-${letter}`].studentObjects.push(student);
          student.assigned = true;
        }
      });
    });
  }

  // Ajouter les étudiants non assignés aux groupes qui ne sont pas pleins
  const unassigned = students.filter(s => !s.assigned);
  unassigned.forEach(student => {
    for (let letter of menus) {
      if (groupsResult[`menu-${letter}`].members.length < targetSize) {
        groupsResult[`menu-${letter}`].members.push(letter);
        groupsResult[`menu-${letter}`].studentObjects.push(student);
        student.assigned = true;
        break;
      }
    }
  });

  // Construire le résultat final
  const finalResult = {};
  menus.forEach(letter => {
    const groupData = groupsResult[`menu-${letter}`];
    const studentsInMenu = groupData.studentObjects;

    // Vérifier la limite max
    if (maxStudentsPerGroup && studentsInMenu.length > maxStudentsPerGroup) {
      console.log(`Groupe Menu ${letter} ignoré (${studentsInMenu.length} > ${maxStudentsPerGroup})`);
      return;
    }

    if (studentsInMenu.length === 0) {
      console.log(`Groupe Menu ${letter} vide, non créé`);
      return;
    }

    // Récupérer les activités du menu
    const menuActivities = getMenuActivities(letter, studentsInMenu);

    finalResult[`menu-${letter}`] = {
      name: `Menu ${letter}`,
      letter,
      activities: menuActivities.map(activity => formatActivityName(activity)),
      members: studentsInMenu.map(m => {
        const assignedMenuOrder = m.menus.findIndex(menu => menu.letter === letter) + 1;
        return {
          prenom: m.prenom,
          nom: m.nom,
          classe: m.classe,
          note1: m.note1,
          note1Activity: m.note1Activity || '',
          note2: m.note2,
          note2Activity: m.note2Activity || '',
          note3: m.note3,
          note3Activity: m.note3Activity || '',
          chosenMenuOrder: assignedMenuOrder,
          allMenus: m.menus
        };
      }),
      count: studentsInMenu.length,
      preferences: getPreferencesDistribution(studentsInMenu)
    };
  });

  return finalResult;
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
