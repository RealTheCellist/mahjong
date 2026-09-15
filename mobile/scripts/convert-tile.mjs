// riichi-mahjong-tiles의 웹 SVG 소스(.tsx)를 react-native-svg 컴포넌트로 변환하는 코드모드.
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default;
const generate = generateModule.default;

const TAG_MAP = {
  svg: 'Svg',
  defs: 'Defs',
  mask: 'Mask',
  filter: 'Filter',
  feGaussianBlur: 'FeGaussianBlur',
  rect: 'Rect',
  circle: 'Circle',
  ellipse: 'Ellipse',
  path: 'Path',
  g: 'G',
  use: 'Use',
  clipPath: 'ClipPath',
  linearGradient: 'LinearGradient',
  radialGradient: 'RadialGradient',
  stop: 'Stop',
  polygon: 'Polygon',
  polyline: 'Polyline',
  line: 'Line',
  symbol: 'Symbol',
  text: 'SvgText',
  tspan: 'TSpan',
};

function convertFile(srcPath, destPath, componentName) {
  const source = fs.readFileSync(srcPath, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });

  const usedTags = new Set();
  let rootJsx = null;

  traverse(ast, {
    JSXOpeningElement(nodePath) {
      const name = nodePath.node.name;
      if (t.isJSXIdentifier(name) && TAG_MAP[name.name]) {
        usedTags.add(TAG_MAP[name.name]);
        name.name = TAG_MAP[name.name];
      }
      nodePath.node.attributes = nodePath.node.attributes.filter(
        (attr) =>
          !(t.isJSXAttribute(attr) && (attr.name.name === 'xmlns' || attr.name.name === 'xmlnsXlink')),
      );
    },
    JSXClosingElement(nodePath) {
      const name = nodePath.node.name;
      if (t.isJSXIdentifier(name) && TAG_MAP[name.name]) {
        name.name = TAG_MAP[name.name];
      }
    },
    JSXAttribute(nodePath) {
      if (nodePath.node.name.name !== 'style') return;
      const value = nodePath.node.value;
      if (!t.isJSXExpressionContainer(value) || !t.isObjectExpression(value.expression)) return;

      const newAttrs = value.expression.properties.map((prop) => {
        if (!t.isObjectProperty(prop)) {
          throw new Error(`unsupported style property in ${srcPath}: ${prop.type}`);
        }
        const keyName = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
        const attrValue = t.isStringLiteral(prop.value)
          ? t.stringLiteral(prop.value.value)
          : t.jsxExpressionContainer(prop.value);
        return t.jsxAttribute(t.jsxIdentifier(keyName), attrValue);
      });

      nodePath.replaceWithMultiple(newAttrs);
    },
    ArrowFunctionExpression(nodePath) {
      if (rootJsx) return;
      const body = nodePath.node.body;
      if (t.isJSXElement(body)) rootJsx = body;
    },
  });

  if (!rootJsx) throw new Error(`could not find root JSX in ${srcPath}`);

  const sortedTags = [...usedTags].filter((tag) => tag !== 'Svg').sort();

  const svgPropsSpecifier = t.importSpecifier(t.identifier('SvgProps'), t.identifier('SvgProps'));
  svgPropsSpecifier.importKind = 'type';

  const program = t.program([
    t.importDeclaration(
      [
        t.importDefaultSpecifier(t.identifier('Svg')),
        svgPropsSpecifier,
        ...sortedTags.map((tag) => t.importSpecifier(t.identifier(tag), t.identifier(tag))),
      ],
      t.stringLiteral('react-native-svg'),
    ),
    t.exportNamedDeclaration(
      t.functionDeclaration(
        t.identifier(componentName),
        [
          Object.assign(t.identifier('props'), {
            typeAnnotation: t.tsTypeAnnotation(t.tsTypeReference(t.identifier('SvgProps'))),
          }),
        ],
        t.blockStatement([t.returnStatement(rootJsx)]),
      ),
    ),
  ]);

  const { code } = generate(t.file(program), { retainLines: false });
  fs.writeFileSync(destPath, code);
}

const [, , srcPath, destPath, componentName] = process.argv;
convertFile(srcPath, destPath, componentName);
