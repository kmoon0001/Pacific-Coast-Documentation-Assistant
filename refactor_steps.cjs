const fs = require('fs');
const path = require('path');
const stepsDir = 'd:/Pacific-Coast-Documentation-Assistant-main/src/components/TherapyApp/steps';
const files = fs.readdirSync(stepsDir).filter(f => f.endsWith('.tsx'));

for (const f of files) {
  const file = path.join(stepsDir, f);
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the first import of StepContentProps or Pick...
  content = content.replace(/import\s+\{([^}]*?)StepContentProps([^}]*?)\}\s+from\s+'\.\.\/\.\.\/\.\.\/types';/g, function(match, p1, p2) {
    const retained = [p1, p2].join('').split(',').map(s => s.trim()).filter(Boolean);
    let newImport = `import { useSession } from '../../../contexts/TherapySessionContext';\nimport { ST_DATA, OT_DATA, PT_DATA } from '../../../data/therapyData';`;
    if (retained.length) {
      newImport = `import { ${retained.join(', ')} } from '../../../types';\n` + newImport;
    }
    return newImport;
  });
  
  // Replace the component definition:
  // e.g., export const DisciplineStep: React.FC<StepContentProps> = ({ state, setState, ... }) => {
  const exportRegex = /export\s+const\s+(\w+):\s*React\.FC(?:<[^>]+>)?\s*=\s*\(\{\s*([\s\S]*?)\s*\}\)\s*=>\s*\{/;
  const match = content.match(exportRegex);
  if (match) {
    const stepName = match[1];
    const argsStr = match[2];
    const args = argsStr.split(',').map(a => a.trim()).filter(Boolean);
    
    let hasCurrentData = false;
    const finalArgs = [];
    for (const a of args) {
      if (a === 'currentData') {
        hasCurrentData = true;
      } else {
        finalArgs.push(a);
      }
    }
    
    let replacement = `export const ${stepName}: React.FC = () => {\n  const {\n    ${finalArgs.join(',\n    ')}\n  } = useSession();`;
    if (hasCurrentData) {
      replacement += `\n  const currentData = state.discipline === 'ST' ? ST_DATA : state.discipline === 'OT' ? OT_DATA : PT_DATA;`;
    }
    content = content.replace(exportRegex, replacement);
  }
  
  fs.writeFileSync(file, content);
}
console.log('Done refactoring steps');
