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
  const firstChoiceDemand = {};
  menus.forEach(letter => {
    firstChoiceDemand[letter] = students.filter(student => student.menus[0]?.letter === letter).length;
  });

  // Extraire les activités réelles de chaque menu depuis les données des étudiants
  const menuActivitiesList = {};
  menus.forEach(letter => {
    const activities = new Set();
    students.forEach(student => {
      const menu = student.menus.find(m => m.letter === letter);
      if (menu && menu.activities) {
        menu.activities.forEach(activity => activities.add(activity.toLowerCase()));
      }
    });
    menuActivitiesList[letter] = Array.from(activities).sort();
  });

  // Initialiser les groupes vides
  menus.forEach(letter => {
    groupsResult[`menu-${letter}`] = {
      letter,
      studentObjects: [],
      capacity: maxStudentsPerGroup || Math.ceil(students.length / menus.length)
    };
  });

  // Affectation globale avec règle stricte:
  // chaque élève doit obtenir son 1er choix ou, si ce n'est pas possible, son 2e choix.
  const assignments = assignFirstOrSecondChoice(students, groupsResult);
  assignments.forEach(({ student, menuLetter, preferenceRank }) => {
    const group = groupsResult[`menu-${menuLetter}`];
    group.studentObjects.push({
      student,
      desiredMenu: student.menus[0]?.letter || null,
      nextChoice: preferenceRank === 1 ? student.menus[1]?.letter || null : null,
      preferenceRank,
      wasRebasculed: preferenceRank === 2
    });

    rebasculageMap[student.id] = {
      studentId: student.id,
      desiredMenu: student.menus[0]?.letter || null,
      finalMenu: menuLetter,
      preferenceRank,
      wasRebasculé: preferenceRank === 2,
      reason: preferenceRank === 2 ? {
        fromMenu: student.menus[0]?.letter || null,
        toMenu: menuLetter,
        surplusDemand: firstChoiceDemand[student.menus[0]?.letter] || 0,
        targetSize: groupsResult[`menu-${student.menus[0]?.letter}`]?.capacity || 0,
        compatibilityPercent: 0,
        text: '1er choix complet: placement obligatoire au 2ème choix'
      } : null,
      compatibility: null
    };
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

function assignFirstOrSecondChoice(students, groupsResult) {
  const graph = new MinCostMaxFlow();
  const source = graph.addNode();
  const sink = graph.addNode();
  const studentNodes = new Map();
  const menuNodes = new Map();
  const assignmentEdges = [];
  const menuLetters = Object.values(groupsResult).map(group => group.letter);

  students.forEach(student => {
    const first = student.menus[0]?.letter;
    const second = student.menus[1]?.letter;
    if (!first || !second) {
      throw new Error(`L'élève ${student.prenom || ''} ${student.nom || ''} doit avoir au moins deux choix de menu.`);
    }
    if (!groupsResult[`menu-${first}`] || !groupsResult[`menu-${second}`]) {
      throw new Error(`Choix de menu invalide pour ${student.prenom || ''} ${student.nom || ''}.`);
    }

    const node = graph.addNode();
    studentNodes.set(student.id, node);
    graph.addEdge(source, node, 1, 0);

    const firstEdge = graph.addEdge(node, getMenuNode(first), 1, 0);
    const secondEdge = graph.addEdge(node, getMenuNode(second), 1, 1);
    assignmentEdges.push({ student, menuLetter: first, preferenceRank: 1, edge: firstEdge });
    assignmentEdges.push({ student, menuLetter: second, preferenceRank: 2, edge: secondEdge });
  });

  menuLetters.forEach(letter => {
    const group = groupsResult[`menu-${letter}`];
    graph.addEdge(getMenuNode(letter), sink, group.capacity, 0);
  });

  const result = graph.minCostMaxFlow(source, sink, students.length);
  if (result.flow < students.length) {
    throw new Error(
      `Affectation impossible avec la règle stricte du 2ème choix.\n` +
      `Chaque élève doit pouvoir être placé sur son 1er ou son 2ème choix, mais les capacités actuelles ne le permettent pas.\n` +
      `Augmentez les capacités ou modifiez les choix de menus.`
    );
  }

  return assignmentEdges
    .filter(({ edge }) => edge.capacity === 0)
    .map(({ student, menuLetter, preferenceRank }) => ({ student, menuLetter, preferenceRank }));

  function getMenuNode(letter) {
    if (!menuNodes.has(letter)) {
      menuNodes.set(letter, graph.addNode());
    }
    return menuNodes.get(letter);
  }
}

class MinCostMaxFlow {
  constructor() {
    this.graph = [];
  }

  addNode() {
    this.graph.push([]);
    return this.graph.length - 1;
  }

  addEdge(from, to, capacity, cost) {
    const forward = { to, rev: this.graph[to].length, capacity, cost };
    const backward = { to: from, rev: this.graph[from].length, capacity: 0, cost: -cost };
    this.graph[from].push(forward);
    this.graph[to].push(backward);
    return forward;
  }

  minCostMaxFlow(source, sink, maxFlow) {
    let flow = 0;
    let cost = 0;
    const nodeCount = this.graph.length;

    while (flow < maxFlow) {
      const dist = Array(nodeCount).fill(Infinity);
      const prevNode = Array(nodeCount).fill(-1);
      const prevEdge = Array(nodeCount).fill(-1);
      const inQueue = Array(nodeCount).fill(false);
      const queue = [source];

      dist[source] = 0;
      inQueue[source] = true;

      while (queue.length > 0) {
        const current = queue.shift();
        inQueue[current] = false;

        this.graph[current].forEach((edge, edgeIndex) => {
          if (edge.capacity <= 0) return;

          const nextDist = dist[current] + edge.cost;
          if (nextDist < dist[edge.to]) {
            dist[edge.to] = nextDist;
            prevNode[edge.to] = current;
            prevEdge[edge.to] = edgeIndex;

            if (!inQueue[edge.to]) {
              queue.push(edge.to);
              inQueue[edge.to] = true;
            }
          }
        });
      }

      if (dist[sink] === Infinity) break;

      let addFlow = maxFlow - flow;
      for (let node = sink; node !== source; node = prevNode[node]) {
        addFlow = Math.min(addFlow, this.graph[prevNode[node]][prevEdge[node]].capacity);
      }

      for (let node = sink; node !== source; node = prevNode[node]) {
        const edge = this.graph[prevNode[node]][prevEdge[node]];
        edge.capacity -= addFlow;
        this.graph[edge.to][edge.rev].capacity += addFlow;
      }

      flow += addFlow;
      cost += addFlow * dist[sink];
    }

    return { flow, cost };
  }
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
