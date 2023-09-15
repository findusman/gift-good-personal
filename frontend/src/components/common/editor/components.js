/* eslint-disable react/display-name */
import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Transforms } from 'slate';
import { useSelected, useSlateStatic, ReactEditor } from 'slate-react';
import { cx, css } from '@emotion/css';
import xMark from 'assets/images/x_mark.svg';
import t from 'helpers/localization';
import { findUrlsInText } from './utils';

export const Button = React.forwardRef(({ className, active, ...props }, ref) => {
  let background = 'transparent';
  let color = 'black';

  if (active) {
    background = 'black';
    color = '#fff';
  }

  return (
    <span
      {...props}
      ref={ref}
      className={cx(
        'hover:bg-gray-200',
        className,
        css`
          color: ${color};
          background: ${background};
          cursor: pointer;
          min-width: 24px;
          text-align: center;
          display: inline-block;
        `,
      )}
    />
  );
});

Button.propTypes = {
  className: PropTypes.string,
  active: PropTypes.bool,
};

Button.defaultProps = {
  className: '',
  active: false,
};

export const Icon = React.forwardRef(({ className, ...props }, ref) => (
  <span
    {...props}
    ref={ref}
    className={cx(
      'material-icons',
      className,
      css`
        font-size: 18px;
        vertical-align: text-bottom;
      `,
    )}
  />
));

Icon.propTypes = {
  className: PropTypes.string,
};

Icon.defaultProps = {
  className: '',
};

export const Menu = React.forwardRef(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        & > * {
          display: inline-block;
        }
        & > * + * {
          margin-left: 15px;
        }
      `,
    )}
  />
));

Menu.propTypes = {
  className: PropTypes.string,
};

Menu.defaultProps = {
  className: '',
};

export const Toolbar = React.forwardRef(({ className, ...props }, ref) => (
  <Menu {...props} ref={ref} className={cx(className, css``)} />
));

Toolbar.propTypes = {
  className: PropTypes.string,
};

Toolbar.defaultProps = {
  className: '',
};

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    className={css`
      font-size: 0;
    `}
  >
    ${String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);

const LinkComponent = React.forwardRef(({ attributes, children, element }, ref) => {
  const selected = useSelected();
  return (
    <a
      {...attributes}
      ref={ref}
      href={element.url}
      className={
        selected
          ? css`
              box-shadow: 0 0 0 3px #ddd;
            `
          : ''
      }
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </a>
  );
});

LinkComponent.propTypes = {
  attributes: PropTypes.shape({}),
  element: PropTypes.shape({
    url: PropTypes.string,
  }),
  children: PropTypes.node.isRequired,
};

LinkComponent.defaultProps = {
  attributes: {},
  element: {
    url: PropTypes.string,
  },
};

const SmartTag = React.forwardRef(({ attributes, children, value, element }, ref) => {
  const { smartTags } = useSelector((state) => ({
    smartTags: state.design.smartTags,
  }));
  const smartTag = smartTags.find((tag) => tag.key === value);

  if (!smartTag) {
    return null;
  }
  const editor = useSlateStatic();
  const handleRemove = () => {
    Transforms.removeNodes(editor, { at: ReactEditor.findPath(editor, element) });
  };

  return (
    <span
      {...attributes}
      ref={ref}
      className="my-2 px-3 py-1 text-sm bg-white-500 text-black rounded-full shadow-md border border-beige-600 remove-smart-tag cursor-pointer whitespace-nowrap"
    >
      <span className="text-sm mr-3" contentEditable={false}>
        {smartTag.label}
      </span>
      <button type="button" className="remove-smart-tag" onClick={handleRemove}>
        <img className="remove-smart-tag" src={xMark} alt="x mark" />
      </button>
      <span>{children}</span>
    </span>
  );
});

SmartTag.propTypes = {
  attributes: PropTypes.shape({}),
  element: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
  value: PropTypes.string,
};

SmartTag.defaultProps = {
  attributes: {},
  element: {},
  value: '',
};

export const Element = ({ attributes, children, element }) => {
  const style = { textAlign: element.align };

  switch (element.type) {
    case 'smart-tag':
      return (
        <SmartTag {...attributes} element={element} value={element.value} format={element.format}>
          {children}
        </SmartTag>
      );
    case 'link':
      return (
        <LinkComponent {...attributes} element={element}>
          {children}
        </LinkComponent>
      );
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'span':
      return <span {...attributes}>{children}</span>;
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

Element.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
  element: PropTypes.shape({
    type: PropTypes.string,
    align: PropTypes.string,
    value: PropTypes.string,
    format: PropTypes.string,
  }),
};

Element.defaultProps = {
  attributes: {},
  element: {
    type: '',
    align: 'left',
    value: '',
    format: '',
  },
};

export const Leaf = ({ attributes, children, leaf }) => {
  let childrenClone = { ...children };

  if (leaf.bold) {
    childrenClone = <strong>{childrenClone}</strong>;
  }

  if (leaf.code) {
    childrenClone = <code>{childrenClone}</code>;
  }

  if (leaf.italic) {
    childrenClone = <em>{childrenClone}</em>;
  }

  if (leaf.underline) {
    childrenClone = <u>{childrenClone}</u>;
  }

  if (leaf.decoration === 'link') {
    childrenClone = (
      <a
        style={{ cursor: 'pointer', textDecoration: 'underline' }}
        href={leaf.text}
        onClick={() => {
          window.location.hre = leaf.text;
        }}
      >
        {childrenClone}
      </a>
    );
  }

  return <span {...attributes}>{childrenClone}</span>;
};

Leaf.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node.isRequired,
  leaf: PropTypes.shape({
    bold: PropTypes.bool,
    code: PropTypes.bool,
    italic: PropTypes.bool,
    underline: PropTypes.bool,
    decoration: PropTypes.string,
    text: PropTypes.string,
  }),
};

Leaf.defaultProps = {
  attributes: {},
  leaf: {
    bold: false,
    code: false,
    italic: false,
    underline: false,
  },
};

export const linkDecorator = ([node, path]) => {
  const nodeText = node.text;

  if (!nodeText) return [];

  const urls = findUrlsInText(nodeText);

  return urls.map(([url, index]) => {
    return {
      anchor: {
        path,
        offset: index,
      },
      focus: {
        path,
        offset: index + url.length,
      },
      decoration: 'link',
    };
  });
};

export const Counter = ({ current, limit, showRecommendationNote }) => {
  return (
    <div className="mt-4 text-right">
      <p className="font-bold">
        {current}/{limit}
      </p>
      {showRecommendationNote && (
        <p>{t('designStep.charactersRecommendation', { key: 'count', replacement: limit })}</p>
      )}
    </div>
  );
};

Counter.propTypes = {
  current: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  showRecommendationNote: PropTypes.bool,
};

Counter.defaultProps = {
  showRecommendationNote: false,
};
