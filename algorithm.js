function createBalancedGroups(students, maxStudentsPerGroup = null, numMenus = null) {
  // Déterminer les menus: soit utiliser numMenus si fourni, soit détecter dynamiquement
  let menus;

  if (numMenus) {
    // Utiliser les premiers N menus (A, B, C, D, E)
    const allMenuLetters = ['A', 'B', 'C', 'D', 'E'];
    menus = allMenuLetters.slice(0, numMenus);
  } else {
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
    menus = Array.from(menuLetters).sort(); // Tri alphabétique
  }
  const totalStudents = students.length;
  const totalCapacity = maxStudentsPerGroup ? menus.length * maxStudentsPerGroup : totalStudents;

  // Vérifier si la capacité est suffisante
  if (maxStudentsPerGroup && totalCapacity < totalStudents) {
    const minPlacesPerMenu = Math.ceil(totalStudents / menus.length);
    throw new Error(
      `Capacité insuffisante! Vous avez ${totalStudents} étudiants pour ${menus.length} menus.\n` +
      `Avec ${maxStudentsPerGroup} places par menu, la capacité totale est de ${totalCapacity} places.\n` +
      `Augmentez le nombre de places à minimum ${minPlacesPerMenu} par menu (total: ${minPlacesPerMenu * menus.length} places).`
    );
  }

  const targetSize = Math.floor(totalStudents / menus.length);
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
      studentObjects: [],
      capacity: maxStudentsPerGroup || Math.ceil(students.length / menus.length)
    };
  });

  // Étape 1 : Assigner les étudiants par ordre de préférence
  // Pour chaque rang de préférence (1er, 2ème, 3ème, etc.)
  for (let preferenceRank = 0; preferenceRank < 5; preferenceRank++) {
    students.forEach(student => {
      // Si l'étudiant est déjà assigné, passer
      if (rebasculageMap[student.id]) {
        return;
      }

      const menuAtRank = student.menus[preferenceRank];
      if (!menuAtRank) return; // Pas de menu à ce rang

      const menuLetter = menuAtRank.letter;
      const group = groupsResult[`menu-${menuLetter}`];

      // Vérifier si la place est disponible
      if (group && group.studentObjects.length < group.capacity) {
        group.studentObjects.push({
          student,
          desiredMenu: menuLetter,
          nextChoice: student.menus[preferenceRank + 1]?.letter || null,
          preferenceRank: preferenceRank + 1
        });

        rebasculageMap[student.id] = {
          studentId: student.id,
          desiredMenu: menuLetter,
          finalMenu: menuLetter,
          preferenceRank: preferenceRank + 1,
          wasRebasculé: preferenceRank > 0,
          reason: preferenceRank > 0 ? `Accepté au choix ${preferenceRank + 1}` : null,
          compatibility: null
        };
      }
    });
  }

  // Étape 2 : Rééquilibrage basé sur la compatibilité des 2ème choix
  // Rejeter les étudiants en 1ère choix qui ont 2+ activités en commun avec leur 2ème choix
  for (let iteration = 0; iteration < 3; iteration++) {
    let anyMovement = false;

    menus.forEach(menuLetter => {
      const group = groupsResult[`menu-${menuLetter}`];
      if (group.studentObjects.length > group.capacity) {
        const excess = group.studentObjects.length - group.capacity;

        // Filtrer les étudiants de 1ère préférence avec un 2ème choix
        const firstChoiceStudents = group.studentObjects
          .filter(s => s.preferenceRank === 1 && s.nextChoice);

        // Calculer la compatibilité avec le 2ème choix
        const withCompatibility = firstChoiceStudents
          .map(s => ({
            ...s,
            compatibility: countCommonActivities(menuLetter, s.nextChoice, menuActivitiesList)
          }))
          .sort((a, b) => b.compatibility - a.compatibility); // Plus compatible en premier

        // Rejeter les plus compatibles (2+ activités en commun en priorité)
        const toReject = withCompatibility
          .filter(s => s.compatibility >= 2) // Prioriser 2+ activités communes
          .slice(0, excess);

        // Si pas assez, prendre aussi les moins compatibles
        if (toReject.length < excess) {
          const remaining = withCompatibility.filter(s => !toReject.includes(s));
          toReject.push(...remaining.slice(0, excess - toReject.length));
        }

        if (toReject.length > 0) {
          anyMovement = true;
          const toRejectIds = new Set(toReject.map(t => t.student.id));
          group.studentObjects = group.studentObjects.filter(s => !toRejectIds.has(s.student.id));

          // Placer dans 2ème choix
          toReject.forEach(rejected => {
            const nextMenu = rejected.nextChoice;
            const nextGroup = groupsResult[`menu-${nextMenu}`];
            if (nextGroup) {
              nextGroup.studentObjects.push({
                student: rejected.student,
                desiredMenu: nextMenu,
                nextChoice: rejected.student.menus[2]?.letter || null,
                preferenceRank: 2
              });

              rebasculageMap[rejected.student.id] = {
                studentId: rejected.student.id,
                desiredMenu: menuLetter,
                finalMenu: nextMenu,
                preferenceRank: 2,
                wasRebasculé: true,
                reason: `Rebasculé au 2ème choix (compatibilité: ${rejected.compatibility}/3 activités)`,
                compatibility: rejected.compatibility
              };
            }
          });
        }
      }
    });

    if (!anyMovement) break;
  }

  // Étape 3 : Gestion des étudiants non-assignés
  // Si un étudiant ne peut pas être assigné (tous ses choix sont pleins)
  const unassignedStudents = students.filter(s => !rebasculageMap[s.id]);

  // Tenter d'assigner les étudiants restants à n'importe quel groupe avec de la place
  unassignedStudents.forEach(student => {
    for (let i = 0; i < menus.length; i++) {
      const menuLetter = menus[i];
      const group = groupsResult[`menu-${menuLetter}`];

      if (group && group.studentObjects.length < group.capacity) {
        group.studentObjects.push({
          student,
          desiredMenu: menuLetter,
          nextChoice: null,
          preferenceRank: null
        });

        rebasculageMap[student.id] = {
          studentId: student.id,
          desiredMenu: student.menus[0]?.letter,
          finalMenu: menuLetter,
          preferenceRank: null,
          wasRebasculé: true,
          reason: 'Tous les choix préférés étaient pleins',
          compatibility: null
        };
        break;
      }
    }
  });

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
