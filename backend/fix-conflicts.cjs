const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<<<<<<< HEAD')) {
    // Regex to match the conflict blocks and keep the HEAD block
    // Syntax:
    // <<<<<<< HEAD
    // (head content)
    // =======
    // (incoming content)
    // >>>>>>> hash
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>>[^\n]*\r?\n?/g;
    const newContent = content.replace(regex, '$1');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed conflicts in ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done fixing conflicts in backend/src');
