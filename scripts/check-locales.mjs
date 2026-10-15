import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from '@fluent/syntax';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const localesDirectory = new URL('src/locales/', root);
const fail = (message) => {
  throw new Error(message);
};

function variableNames(node, variables = new Set()) {
  if (!node || typeof node !== 'object') return variables;
  if (node.type === 'VariableReference') variables.add(node.id.name);
  for (const value of Object.values(node)) {
    if (Array.isArray(value))
      value.forEach((item) => variableNames(item, variables));
    else if (value && typeof value === 'object')
      variableNames(value, variables);
  }
  return variables;
}

function readCatalog(file) {
  const resource = parse(readFileSync(new URL(file, localesDirectory), 'utf8'));
  const messages = new Map();
  for (const entry of resource.body) {
    if (entry.type === 'Junk')
      fail(
        `${file}: invalid Fluent syntax: ${entry.annotations.map((item) => item.message).join(', ')}`,
      );
    if (entry.type !== 'Message') continue;
    const key = entry.id.name;
    if (!entry.value || messages.has(key))
      fail(`${file}: empty or duplicate message ${key}`);
    messages.set(key, [...variableNames(entry)].sort().join(','));
  }
  return messages;
}

const files = readdirSync(localesDirectory).filter((name) =>
  name.endsWith('.ftl'),
);
if (!files.includes('ru.ftl') || !files.includes('en.ftl'))
  fail('Russian and English catalogs are required');
const base = readCatalog('ru.ftl');
for (const file of files) {
  const catalog = readCatalog(file);
  if (catalog.size !== base.size)
    fail(`${file}: message count differs from ru.ftl`);
  for (const [key, variables] of base) {
    if (!catalog.has(key)) fail(`${file}: missing message ${key}`);
    if (catalog.get(key) !== variables)
      fail(`${file}: variables differ for ${key}`);
  }
}

function literalKeys(expression) {
  if (ts.isStringLiteral(expression)) return [expression.text];
  if (ts.isConditionalExpression(expression))
    return [
      ...literalKeys(expression.whenTrue),
      ...literalKeys(expression.whenFalse),
    ];
  return [];
}

function inspectSource(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      inspectSource(new URL(`${entry.name}/`, directory));
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    const source = readFileSync(path, 'utf8');
    const ast = ts.createSourceFile(
      fileURLToPath(path),
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const checkKey = (key) => {
      if (!base.has(key)) fail(`${entry.name}: unknown translation key ${key}`);
    };
    function visit(node) {
      if (
        ts.isStringLiteral(node) &&
        /^(section|status|error)-[a-z-]+$/.test(node.text)
      )
        checkKey(node.text);
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 't' &&
        node.arguments.length > 0
      ) {
        for (const key of literalKeys(node.arguments[0])) {
          checkKey(key);
          const required = base.get(key);
          const argument = node.arguments[1];
          const supplied =
            argument && ts.isObjectLiteralExpression(argument)
              ? argument.properties
                  .map((property) => property.name?.getText(ast))
                  .sort()
                  .join(',')
              : '';
          if (required !== supplied)
            fail(
              `${entry.name}: translation variables differ for ${key}: expected [${required}], got [${supplied}]`,
            );
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
}
inspectSource(new URL('src/', root));
console.log(
  `Validated ${base.size} messages in ${files.length} locales and their source references.`,
);
