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

  // Étape 1 : Assigner les 1er choix
  students.forEach(student => {
    const menuAtRank = student.menus[0];
    if (!menuAtRank) return;

    const menuLetter = menuAtRank.letter;
    const group = groupsResult[`menu-${menuLetter}`];

    if (group && group.studentObjects.length < group.capacity) {
      group.studentObjects.push({
        student,
        desiredMenu: menuLetter,
        nextChoice: student.menus[1]?.letter || null,
        preferenceRank: 1,
        wasRebasculed: false
      });

      rebasculageMap[student.id] = {
        studentId: student.id,
        desiredMenu: menuLetter,
        finalMenu: menuLetter,
        preferenceRank: 1,
        wasRebasculé: false,
        reason: null,
        compatibility: null
      };
    }
  });

  // Étape 1b : Identifier les étudiants rebasculés (n'ont pas eu leur 1er choix)
  let rebasculedStudents = students.filter(s => !rebasculageMap[s.id]);
  const assignedFromRank2OnlyRebasculed = new Set();

  // Étape 2 : Assigner les choix des REBASCULÉS avec priorité absolue
  // Ils peuvent remplacer les étudiants de 1er choix si nécessaire
  for (let preferenceRank = 1; preferenceRank < 5; preferenceRank++) {
    const toAssignThisRank = rebasculedStudents.filter(s => !assignedFromRank2OnlyRebasculed.has(s.id));

    toAssignThisRank.forEach(student => {
      const menuAtRank = student.menus[preferenceRank];
      if (!menuAtRank) return;

      const menuLetter = menuAtRank.letter;
      const group = groupsResult[`menu-${menuLetter}`];

      if (!group) return;

      // Vérifier si le groupe a de la capacité
      if (group.studentObjects.length < group.capacity) {
        // Capacité disponible, ajouter directement
        group.studentObjects.push({
          student,
          desiredMenu: student.menus[0].letter,
          nextChoice: student.menus[preferenceRank + 1]?.letter || null,
          preferenceRank: preferenceRank + 1,
          wasRebasculed: true
        });

        rebasculageMap[student.id] = {
          studentId: student.id,
          desiredMenu: student.menus[0].letter,
          finalMenu: menuLetter,
          preferenceRank: preferenceRank + 1,
          wasRebasculé: true,
          reason: {
            fromMenu: student.menus[0].letter,
            toMenu: menuLetter,
            surplusDemand: group.studentObjects.length + 1,
            targetSize: group.capacity,
            compatibilityPercent: 0,
            text: `Priorité rebasculé: placé au choix ${preferenceRank + 1}`
          },
          compatibility: null
        };

        assignedFromRank2OnlyRebasculed.add(student.id);
      } else {
        // Le groupe est plein, rejeter un étudiant de 1er choix
        const firstChoiceStudents = group.studentObjects.filter(s => s.preferenceRank === 1);

        if (firstChoiceStudents.length > 0) {
          // Calculer compatibilité de chaque 1er choix avec le menu du rebasculé
          const withCompatibility = firstChoiceStudents
            .map(s => ({
              ...s,
              compatibility: countCommonActivities(menuLetter, s.desiredMenu, menuActivitiesList)
            }))
            .sort((a, b) => b.compatibility - a.compatibility); // Meilleur compatible d'abord

          // Préférer rejeter celui avec 2+ activités en commun
          const toReject = withCompatibility.find(s => s.compatibility >= 2) || withCompatibility[0];

          if (toReject) {
            const rejectedStudent = toReject.student;
            const rejectedId = rejectedStudent.id;

            // Retirer le rejeté du groupe
            group.studentObjects = group.studentObjects.filter(s => s.student.id !== rejectedId);

            // Ajouter le rebasculé à la place
            group.studentObjects.push({
              student,
              desiredMenu: student.menus[0].letter,
              nextChoice: student.menus[preferenceRank + 1]?.letter || null,
              preferenceRank: preferenceRank + 1,
              wasRebasculed: true
            });

            rebasculageMap[student.id] = {
              studentId: student.id,
              desiredMenu: student.menus[0].letter,
              finalMenu: menuLetter,
              preferenceRank: preferenceRank + 1,
              wasRebasculé: true,
              reason: {
                fromMenu: student.menus[0].letter,
                toMenu: menuLetter,
                surplusDemand: group.capacity + 1,
                targetSize: group.capacity,
                compatibilityPercent: 0,
                text: `Priorité rebasculé: placé au choix ${preferenceRank + 1}`
              },
              compatibility: null
            };

            assignedFromRank2OnlyRebasculed.add(student.id);

            // Le rejeté n'est plus assigné
            delete rebasculageMap[rejectedId];

            // Ajouter le rejeté au liste de rebasculés si pas encore dedans
            if (!rebasculedStudents.includes(rejectedStudent)) {
              rebasculedStudents.push(rejectedStudent);
            }
          }
        }
      }
    });
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
          reason: {
            fromMenu: student.menus[0]?.letter,
            toMenu: menuLetter,
            surplusDemand: students.length,
            targetSize: menus.length * group.capacity,
            compatibilityPercent: 0,
            text: 'Tous les choix préférés étaient pleins'
          },
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

    // Récupérer les activités du menu (vide si aucun étudiant)
    const menuActivities = studentsInMenu.length > 0 ? getMenuActivities(letter, studentsInMenu) : [];

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
