import fs from 'fs';
import path from 'path';

const colors = ['#FFD700', '#A3FF12', '#4FC3F7', '#FF5252', '#FFFFFF', '#FFB74D'];
let idx = 0;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.css'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // CSS variables
  if (file.endsWith('index.css')) {
    content = content.replace(/--text-dim:\s*#8B949E;/g, '--text-dim: #FFFFFF;');
    content = content.replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0\.[3-7]\)/g, () => `color: ${colors[++idx % colors.length]}`);
  }

  // JSX styles
  content = content.replace(/color:\s*['"]var\(--text-dim\)['"]/g, () => `color: '${colors[++idx % colors.length]}'`);
  content = content.replace(/color:\s*['"]#8B949E['"]/g, () => `color: '${colors[++idx % colors.length]}'`);
  content = content.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.[3-7]\)['"]/g, () => `color: '${colors[++idx % colors.length]}'`);
  content = content.replace(/color:\s*var\(--text-dim\)/g, () => `color: ${colors[++idx % colors.length]}`);

  // In TS/JS sometimes text is grey directly via strings
  content = content.replace(/'#8B949E'/g, () => `'${colors[++idx % colors.length]}'`);
  content = content.replace(/'rgba\(255, ?255, ?255, ?0\.[3-7]\)'/g, () => `'${colors[++idx % colors.length]}'`);
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
console.log('All grey fonts replaced with vibrant colors!');
