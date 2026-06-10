const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testApp() {
  const filePath = './Choix des menus EPS – Terminale (1-2).xlsx';
  const fileStream = fs.createReadStream(filePath);

  const form = new FormData();
  form.append('file', fileStream);

  try {
    console.log('📤 Uploading file...');
    const uploadRes = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }

    const data = await uploadRes.json();
    console.log(`✅ Upload successful!`);
    console.log(`📊 ${data.students.length} students processed`);
    console.log(`🏃 ${Object.keys(data.groups).length} groups created\n`);

    console.log('📋 Groups:');
    Object.entries(data.groups)
      .filter(([_, g]) => g.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([activity, group]) => {
        console.log(`\n${group.name}`);
        console.log(`  👥 ${group.count} student(s) | ⭐ Avg: ${group.avgGrade}`);
        group.members.forEach(m => {
          console.log(`    • ${m.prenom} ${m.nom} (${m.classe}) - ${m.avgGrade}`);
        });
      });

    console.log('\n\n📥 Testing export...');
    const exportRes = await fetch('http://localhost:3000/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!exportRes.ok) {
      throw new Error(`Export failed: ${exportRes.status}`);
    }

    const buffer = await exportRes.buffer();
    const outputPath = `./groupes_demo_${new Date().toISOString().slice(0, 10)}.xlsx`;
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Export successful: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApp();
