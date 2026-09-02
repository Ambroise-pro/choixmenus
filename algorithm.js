function createBalancedGroups(students, maxStudentsPerGroup = null) {
  // Déterminer dynamiquement les menus présents dans les données
  const menuLetters = new Set();
  students.forEach(student => {
    if (student.menus && Array.isArray(student.menus)) {
      student.menus.forEach(menu => {
        if (menu.letter) {
          menuLetters.add(menu.letter);
        }
      });
    }
  });

  const menus = Array.from(menuLetters).sort(); // Tri alphabétique
  const targetSize = Math.floor(students.length / menus.length);
  const groupsResult = {};
  const rebasculageMap = {}; // Tracker les rebasculages

  // Définir les activités de chaque menu
  const menuActivitiesList = {
    'A': ['demi-fond', 'escalade', 'badminton'],
    'B': ['escalade', 'volley-ball', 'demi-fond'],
    'C': ['danse', 'natation', 'step'],
    'D': ['volley-ball', 'danse', 'natation'],
    'E': ['foot', 'musculation', 'demi-fond']
  };

  // Initialiser les groupes vides
  menus.forEach(letter => {
    groupsResult[`menu-${letter}`] = {
      letter,
      studentObjects: []
    };
  });

  // Étape 1 : Assigner les étudiants par 1ère préférence
  students.forEach(student => {
    const firstMenuLetter = student.menus[0]?.letter;
    if (firstMenuLetter) {
      groupsResult[`menu-${firstMenuLetter}`].studentObjects.push({
        student,
        desiredMenu: firstMenuLetter,
        nextChoice: student.menus[1]?.letter || null
      });
      rebasculageMap[student.id] = {
        studentId: student.id,
        desiredMenu: firstMenuLetter,
        finalMenu: firstMenuLetter,
        wasRebasculé: false,
        reason: null,
        compatibility: null
      };
    }
  });

  // Étape 2 : Équilibrer les groupes surpeuplés
  for (let iteration = 0; iteration < 5; iteration++) {
    const overfull = menus.filter(m => groupsResult[`menu-${m}`].studentObjects.length > targetSize);

    if (overfull.length === 0) break;

    overfull.forEach(menuLetter => {
      const groupStudents = groupsResult[`menu-${menuLetter}`].studentObjects;
      const excess = groupStudents.length - targetSize;
      const totalDemand = groupStudents.length;

      if (excess > 0) {
        // Calculer la compatibilité de chaque étudiant avec leur 2ème choix
        const withCompatibility = groupStudents
          .filter(s => s.nextChoice)
          .map(s => ({
            ...s,
            compatibility: countCommonActivities(menuLetter, s.nextChoice, menuActivitiesList)
          }))
          .sort((a, b) => b.compatibility - a.compatibility); // Plus compatible en premier

        // Rejeter les plus compatibles (moins de perte pour eux)
        const toReject = withCompatibility.slice(0, excess);
        const toKeepStudents = new Set(toReject.map(t => t.student.id));
        const toKeep = groupStudents.filter(gs => !toKeepStudents.has(gs.student.id));

        groupsResult[`menu-${menuLetter}`].studentObjects = toKeep;

        // Placer les rejetés dans leur 2ème choix et tracker le rebasculage
        toReject.forEach(rejected => {
          const nextMenu = rejected.nextChoice;
          groupsResult[`menu-${nextMenu}`].studentObjects.push({
            student: rejected.student,
            desiredMenu: nextMenu,
            nextChoice: rejected.student.menus[2]?.letter || null
          });

          // Enregistrer le rebasculage
          rebasculageMap[rejected.student.id] = {
            studentId: rejected.student.id,
            desiredMenu: menuLetter,
            finalMenu: nextMenu,
            wasRebasculé: true,
            reason: {
              surplusDemand: totalDemand,
              targetSize: targetSize,
              compatibilityScore: rejected.compatibility,
              compatibilityPercent: ((rejected.compatibility / 3) * 100).toFixed(1),
              fromMenu: menuLetter,
              toMenu: nextMenu
            },
            compatibility: rejected.compatibility
          };
        });
      }
    });
  }

  // Étape 3 : Construire le résultat final
  const finalResult = {};
  menus.forEach(letter => {
    const groupData = groupsResult[`menu-${letter}`];
    const studentsInMenu = groupData.studentObjects.map(s => s.student);

    // Vérifier la limite max
    if (maxStudentsPerGroup && studentsInMenu.length > maxStudentsPerGroup) {
      console.log(`Groupe Menu ${letter} ignoré (${studentsInMenu.length} > ${maxStudentsPerGroup})`);
      return;
    }

    if (studentsInMenu.length === 0) {
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
        const rebasculageInfo = rebasculageMap[m.id];
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
          allMenus: m.menus,
          rebasculage: rebasculageInfo
        };
      }),
      count: studentsInMenu.length,
      preferences: getPreferencesDistribution(studentsInMenu)
    };
  });

  return finalResult;
}

function countCommonActivities(menu1, menu2, menuActivitiesList) {
  const activities1 = menuActivitiesList[menu1] || [];
  const activities2 = menuActivitiesList[menu2] || [];

  let common = 0;
  activities1.forEach(a1 => {
    if (activities2.some(a2 => a2.toLowerCase() === a1.toLowerCase())) {
      common++;
    }
  });
  return common;
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
