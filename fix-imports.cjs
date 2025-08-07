#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix imports in a file
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace .js extensions in imports with no extension
  const jsImportRegex = /from\s+["']([^"']+)\.js["']/g;
  if (jsImportRegex.test(content)) {
    content = content.replace(jsImportRegex, 'from "$1"');
    modified = true;
    console.log(`Fixed imports in: ${filePath}`);
  }
  
  // Also fix any remaining .js imports
  const jsImportRegex2 = /import\s+.*\s+from\s+["']([^"']+)\.js["']/g;
  if (jsImportRegex2.test(content)) {
    content = content.replace(jsImportRegex2, (match) => match.replace('.js', ''));
    modified = true;
    console.log(`Fixed additional imports in: ${filePath}`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return modified;
}

// Main execution
console.log('Fixing imports in TypeScript files...');

const tsFiles = findTsFiles('./src');
let totalFixed = 0;

for (const file of tsFiles) {
  if (fixImports(file)) {
    totalFixed++;
  }
}

console.log(`\nFixed imports in ${totalFixed} files.`);
console.log('Now try running: npm run build');