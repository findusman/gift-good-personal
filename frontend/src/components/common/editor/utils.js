import { Text } from 'slate';
import { jsx } from 'slate-hyperscript';
import escapeHtml from 'escape-html';
import { smartTags } from 'store/createCampaign/design/designSlice';

export const removeFromString = (string, arr) => {
  return arr.reduce((result, word) => result.replace(word, ''), string);
};

export const findUrlsInText = (text) => {
  const urlRegex =
    // eslint-disable-next-line no-useless-escape
    /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;

  const matches = text.match(urlRegex);

  return matches ? matches.map((m) => [m.trim(), text.indexOf(m.trim())]) : [];
};

// eslint-disable-next-line default-param-last
const serializeReducer = (acc = [], node, useNewFormat) => {
  const className = Object.entries(node).reduce((classNames, [prop, value]) => {
    switch (prop) {
      case 'align':
        return [...classNames, `align-${value}`];
      case 'indent':
        return [...classNames, `indent-${value}`];
      case 'lineHeight':
        return [...classNames, `line-height-${String(value).replace('.', '_')}`];
      case 'fontSize':
        return [...classNames, `font-size-${value}`];
      case 'bold':
      case 'italic':
      case 'underline':
        return [...classNames, prop];
      default:
        return classNames;
    }
  }, []);

  const classAttribute = className.length ? ` class="${className.join(' ')}"` : '';

  if (Text.isText(node)) {
    return classAttribute
      ? `${acc}<span${classAttribute}>${escapeHtml(node.text)}</span>`
      : `${acc}${escapeHtml(node.text)}`;
  }

  const children = node.children.reduce((a, nodeElement) => serializeReducer(a, nodeElement, useNewFormat), '');

  switch (node.type) {
    case 'bulleted-list':
      return `${acc}<ul${classAttribute}>${children}</ul>`;
    case 'list-item':
      return `${acc}<li${classAttribute}>${children}</li>`;
    case 'hr':
      return `${acc}<hr />`;
    case 'paragraph':
      return `${acc}<p${classAttribute}>${children}</p>`;
    case 'link':
      return `${acc}<a href="${escapeHtml(
        node.url,
      )}"${classAttribute} target="_blank" rel="noreferrer">${children}</a>`;
    case 'smart-tag':
      // exact type check required
      if (useNewFormat === true) {
        const relatedSmartTag = smartTags.find((tag) => tag.format === node.format);
        return `${acc}<strong>${escapeHtml(relatedSmartTag.key)}</strong>`;
      }

      return `${acc}${escapeHtml(node.format)}`;
    default:
      return `${acc}${children}`;
  }
};

const replaceSmartTags = (html) => {
  if (html) {
    let newHtml = html;
    smartTags.forEach((tag) => {
      newHtml = newHtml.replaceAll(tag.format, `<smart-tag type="${tag.format}"></smart-tag>`);
    });
    return newHtml;
  }
  return '';
};

const deserialize = (el, markAttributes = {}) => {
  if (el.nodeType === Node.TEXT_NODE) {
    return jsx('text', { type: 'span', ...markAttributes }, el.textContent);
  }
  if (el.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const nodeAttributes = { ...markAttributes };

  const classList = el.className && el.className.split(' ');
  if (classList && classList.length) {
    if (classList.includes('bold')) {
      nodeAttributes.bold = true;
    }
    if (classList.includes('italic')) {
      nodeAttributes.italic = true;
    }
    if (classList.includes('underline')) {
      nodeAttributes.underline = true;
    }
    const alignClass = classList.find((className) => className.includes('align-'));
    if (alignClass) {
      // eslint-disable-next-line prefer-destructuring
      nodeAttributes.align = alignClass.split('-')[1];
    }
  }

  const children = Array.from(el.childNodes)
    .map((node) => deserialize(node, nodeAttributes))
    .flat();

  if (children.length === 0) {
    children.push(jsx('text', nodeAttributes, ''));
  }
  switch (el.nodeName) {
    case 'BODY':
      return jsx('fragment', {}, children);
    case 'BR':
      return '\n';
    case 'P':
      return jsx('element', { type: 'paragraph', ...nodeAttributes }, children);
    case 'A':
      return jsx('element', { type: 'link', url: el.getAttribute('href'), ...nodeAttributes }, children);
    case 'UL':
      return jsx('element', { type: 'bulleted-list' }, children);
    case 'LI':
      return jsx('element', { type: 'list-item', ...nodeAttributes }, children);
    case 'HR':
      return jsx('element', { type: 'hr' });
    case 'SMART-TAG':
      // eslint-disable-next-line no-case-declarations
      const smartTag = smartTags.find((tag) => el.getAttribute('type') === tag.format);
      return jsx('element', { type: 'smart-tag', format: smartTag.format, value: smartTag.key }, [
        {
          type: 'span',
          text: ' ',
          marks: [],
        },
      ]);
    default:
      return children;
  }
};

export const serializeHtml = (nodes, useNewFormat = false) => {
  const serializedHtml = nodes.reduce((acc, node) => serializeReducer(acc, node, useNewFormat), '');

  return `${serializedHtml}`;
};

export const deserializeHtml = (value) => {
  const html = value ? replaceSmartTags(value) : '<p></p>';
  const document = new DOMParser().parseFromString(html, 'text/html');
  return deserialize(document.body);
};
