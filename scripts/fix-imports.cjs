const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'App', 'React', 'components', 'ui');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
let fixed = 0;
for (const f of files) {
  const fp = path.join(dir, f);
  let content = fs.readFileSync(fp, 'utf8');
  const orig = content;
  content = content.replace(/from '\/BotonBase'/g, "from './BotonBase'");
  content = content.replace(/from '\/CampoTexto'/g, "from './CampoTexto'");
  content = content.replace(/from '\/SelectorBase'/g, "from './SelectorBase'");
  if (content !== orig) {
    fs.writeFileSync(fp, content);
    fixed++;
    console.log('Fixed: ' + f);
  }
}
console.log('Total fixed: ' + fixed);
