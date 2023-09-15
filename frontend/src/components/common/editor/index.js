/* eslint-disable no-param-reassign */
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import isUrl from 'is-url';
import isHotkey, { isKeyHotkey } from 'is-hotkey';
import { createEditor, Editor, Element as SlateElement, Transforms, Range, Node, Path } from 'slate';
import { Slate, Editable, ReactEditor, withReact, useSlate } from 'slate-react';
import { withHistory } from 'slate-history';
import { Listbox } from '@headlessui/react';
import classnames from 'classnames';

import {
  smartTags,
  setSmartTagsDialogVisibility,
  setLandingPageMessage,
  setEmailMessage,
  setSignature,
  setSubject,
  setFormData,
  setRichTextsValidationState,
  handleUploadFromLibrary,
} from 'store/createCampaign/design/designSlice';
import { removeFromString, serializeHtml } from 'components/common/editor/utils';
import content from 'data/content.json';
import { Button, Icon, Toolbar, Element, Leaf, Counter } from './components';

const zeroWidthChar = '\u00a0';
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};
const requiredFields = ['subject', 'emailMessage'];
const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];
const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format,
    }),
  );

  return !!match;
};
const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type');
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });
  let newProperties;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    let type;

    if (isActive) {
      type = 'paragraph';
    } else {
      type = isList ? 'list-item' : format;
    }

    newProperties = {
      type,
    };
  }
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};
const BlockButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      className="mr-1"
      active={isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type')}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

BlockButton.propTypes = {
  format: PropTypes.string,
  icon: PropTypes.string,
};
BlockButton.defaultProps = {
  format: '',
  icon: '',
};

const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
  return !!link;
};
const unwrapLink = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
  });
};
const wrapLink = (editor, url) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};
const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};
const AddLinkButton = () => {
  const editor = useSlate();
  return (
    <Button
      active={isLinkActive(editor)}
      onMouseDown={(event) => {
        event.preventDefault();
        const url = window.prompt('Enter the URL of the link:');
        if (!url) return;
        insertLink(editor, url);
      }}
    >
      <Icon>link</Icon>
    </Button>
  );
};
const RemoveLinkButton = () => {
  const editor = useSlate();

  return (
    <Button
      active={isLinkActive(editor)}
      onMouseDown={() => {
        if (isLinkActive(editor)) {
          unwrapLink(editor);
        }
      }}
    >
      <Icon>link_off</Icon>
    </Button>
  );
};
const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};
const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};
const MarkButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      className="mr-1"
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

MarkButton.propTypes = {
  format: PropTypes.string,
  icon: PropTypes.string,
};

MarkButton.defaultProps = {
  format: '',
  icon: '',
};

const SmartTagsDropdown = ({ excludeTags, type, disabled }) => {
  const dispatch = useDispatch();
  const { unsupportedTags } = useSelector((state) => ({
    unsupportedTags: state.recipient.unsupportedTags,
  }));
  const editor = useSlate();
  const onChange = ({ key, format }) => {
    Transforms.insertNodes(editor, {
      type: 'smart-tag',
      value: key,
      format,
      children: [{ type: 'span', text: `${zeroWidthChar}`, marks: [] }],
    });
    Transforms.move(editor, { distance: 1 });
    ReactEditor.focus(editor);
  };
  const tagsToExclude = [...new Set(unsupportedTags), ...new Set(excludeTags)];
  const availableTags = smartTags.filter((tag) => tagsToExclude.indexOf(tag.relatedFormField) < 0);
  const orderedAvailableTags = availableTags.sort((a, b) => (a.order?.[type] || 1) - (b.order?.[type] || 1));

  return (
    <div
      className={classnames('mb-4 flex items-center justify-center', { 'pointer-events-none opacity-60': disabled })}
    >
      <Listbox onChange={onChange}>
        <Listbox.Button className="px-3 py-1 text-sm bg-white-500 text-black rounded-full shadow-lg border border-beige-600 flex items-center">
          <Icon
            style={{
              width: '18px',
            }}
          >
            add_circle_outlined
          </Icon>
          <span className="ml-2.5 text-sm">{content.editor.addSmartTag}</span>
        </Listbox.Button>
        <Listbox.Options className="absolute mt-1 max-h-60 overflow-auto rounded-md bg-white p-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50 min-w-[250px] cursor-pointer">
          {orderedAvailableTags.map((tag) => (
            <Listbox.Option key={tag.key} value={{ key: tag.key, format: tag.format }}>
              {tag.label}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Listbox>
      <button className="underline ml-2.5" type="button" onClick={() => dispatch(setSmartTagsDialogVisibility(true))}>
        <Icon
          style={{
            width: '18px',
          }}
        >
          help_outline
        </Icon>
        <span className="hidden">{content.designStep.learnAboutSmartTags}</span>
      </button>
    </div>
  );
};

SmartTagsDropdown.propTypes = {
  excludeTags: PropTypes.arrayOf(PropTypes.string),
  type: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

SmartTagsDropdown.defaultProps = {
  excludeTags: [],
  disabled: false,
};

const withInlines = (editor) => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element) => ['link'].includes(element.type) || isInline(element);

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data) => {
    const text = data.getData('text/plain');

    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};
const withSmartTags = (editor) => {
  const { isVoid, isInline, normalizeNode } = editor;

  editor.isVoid = (element) => {
    return element.type === 'smart-tag' ? true : isVoid(element);
  };
  editor.isInline = (element) => {
    return element.type === 'smart-tag' ? true : isInline(element);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (node.type === 'smart-tag') {
      const parentNode = Node.parent(editor, path);
      const isFirstChild = !Path.hasPrevious(path);
      const islastChild = path[path.length - 1] === parentNode.children.length - 1;
      const nextPath = Path.next(path);

      let hasPreviousAdjacentInlineVoid = false;
      if (!isFirstChild) {
        const prevSibling = Node.get(editor, Path.previous(path));
        hasPreviousAdjacentInlineVoid = prevSibling.type === 'smart-tag';
      }

      if (islastChild) {
        Transforms.insertNodes(editor, { type: 'span', text: zeroWidthChar }, { at: nextPath });
      }
      if (isFirstChild || hasPreviousAdjacentInlineVoid) {
        Transforms.insertNodes(editor, { type: 'span', text: zeroWidthChar }, { at: path });
      }
    }

    normalizeNode(entry);
  };

  return editor;
};
const validate = (slateContent) => {
  const regex = /(<([^>]+)>)/gi;

  return !!slateContent.replace(regex, '').trim().length;
};
const RichText = ({ type, useRichEditor, minHeight, label, autoFocus, setValue, counter }) => {
  const [touched, setTouched] = useState(false);
  const excludedSmartTags = smartTags
    .filter((item) => {
      const { excludedFor = [] } = item;

      return excludedFor.indexOf(type) >= 0;
    })
    .map((item) => item.relatedFormField);
  const dispatch = useDispatch();
  const { formData, emailMessage, signature, landingMessage, subject, richTextsValidation, libraryUpload } =
    useSelector((state) => ({
      landingMessage: state.design.landingMessage,
      emailMessage: state.design.emailMessage,
      signature: state.design.signature,
      subject: state.design.subject,
      formData: state.design.formData,
      richTextsValidation: state.design.richTextsValidation,
      libraryUpload: state.design.libraryUpload,
    }));
  let initialValue = subject;
  const [excludeSmartTags] = useState(excludedSmartTags || []);
  const [isNormalized, setIsNormalized] = useState(false);
  const editor = useMemo(() => withSmartTags(withInlines(withHistory(withReact(createEditor())))), []);
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const hasError = touched && !richTextsValidation[type] && requiredFields.indexOf(type) >= 0;
  const validateInitialValues = (key) => {
    const value = subject;
    const serializedValue = serializeHtml(value);

    if (!formData[key]) {
      dispatch(setSubject(value));
      dispatch(setFormData({ ...formData, [key]: serializedValue }));
      setValue(key, serializedValue);
      dispatch(
        setRichTextsValidationState({
          type: key,
          value: validate(serializedValue),
        }),
      );
    }
  };

  if (type === 'landingMessage') {
    initialValue = landingMessage;
  } else if (type === 'emailMessage') {
    initialValue = emailMessage;
  } else if (type === 'signature') {
    initialValue = signature;
  }

  const countCharacters = (value) => {
    const tag = document.createElement('div');
    tag.innerHTML = value;

    return removeFromString(
      tag.textContent || tag.innerText || '',
      smartTags.map((item) => item.format),
    )?.length;
  };
  const [characters, count] = useState(counter ? countCharacters(formData[type]) : 0);
  const disableSmartTags = !!counter && characters > counter;
  const handleOnChange = (value, key = type) => {
    const editorFields = ['landingMessage', 'emailMessage', 'signature', 'subject'];
    const serializedValue = serializeHtml(value);

    if (key === 'landingMessage') {
      dispatch(setLandingPageMessage(value));
      dispatch(setFormData({ ...formData, landingMessage: serializedValue }));
    } else if (key === 'emailMessage') {
      dispatch(setEmailMessage(value));
      dispatch(setFormData({ ...formData, emailMessage: serializedValue }));
    } else if (key === 'signature') {
      dispatch(setSignature(value));
      dispatch(setFormData({ ...formData, signature: serializedValue }));
    } else if (key === 'subject') {
      dispatch(setSubject(value));
      dispatch(setFormData({ ...formData, subject: serializedValue }));
    }

    if (requiredFields.indexOf(key) >= 0) {
      dispatch(
        setRichTextsValidationState({
          type: key,
          value: validate(serializedValue),
        }),
      );
    }

    if (counter) {
      count(countCharacters(serializedValue));
    }

    if (editorFields.indexOf(key) < 0) {
      return;
    }

    setValue(key, serializedValue, { shouldValidate: true, shouldDirty: true });

    if (libraryUpload?.type) {
      dispatch(handleUploadFromLibrary(null));
    } else {
      setTouched(true);
    }
  };
  useEffect(() => {
    if (!isNormalized) {
      Editor.normalize(editor, { force: true });
      setIsNormalized(true);

      if (type === 'signature') {
        excludeSmartTags.push('signature');
      }
    }
  });

  useEffect(() => {
    if (libraryUpload?.type === type) {
      let val;

      if (type === 'landingMessage') {
        val = landingMessage;
      } else if (type === 'emailMessage') {
        val = emailMessage;
      }

      handleOnChange(val, libraryUpload?.type);
    }
  }, [libraryUpload]);

  useEffect(() => {
    validateInitialValues('subject');
  }, []);

  return (
    <div className="relative">
      <div className="max-w-[633px] pb-10 block editor-wrapper">
        <Slate
          editor={editor}
          value={initialValue}
          onChange={handleOnChange}
          key={`${libraryUpload?.type}-${libraryUpload?.key}`}
        >
          <div className="flex flex-col items-end md:flex-row md:justify-between md:items-end">
            <div>{label}</div>
            <SmartTagsDropdown excludeTags={excludeSmartTags} type={type} disabled={disableSmartTags} />
          </div>
          <div className="border border-gray">
            {useRichEditor && (
              <Toolbar className="p-3 border-b border-gray flex flex-wrap justify-center md:justify-start bg-white">
                <MarkButton format="bold" icon="format_bold" />
                <MarkButton format="italic" icon="format_italic" />
                <MarkButton format="underline" icon="format_underlined" />
                <BlockButton format="left" icon="format_align_left" />
                <BlockButton format="center" icon="format_align_center" />
                <BlockButton format="right" icon="format_align_right" />
                <BlockButton format="justify" icon="format_align_justify" />
                <AddLinkButton />
                <RemoveLinkButton />
              </Toolbar>
            )}
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder=" "
              autoFocus={autoFocus}
              spellCheck
              className="bg-white p-4 leading-7 smart-tags-editor"
              style={{ minHeight: minHeight || '300px' }}
              onKeyDown={(event) => {
                if (useRichEditor) {
                  Object.keys(HOTKEYS).forEach((hotkey) => {
                    if (isHotkey(hotkey, event)) {
                      event.preventDefault();
                      const mark = HOTKEYS[hotkey];
                      toggleMark(editor, mark);
                    }
                  });
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                }

                const { selection } = editor;

                if (selection && Range.isCollapsed(selection)) {
                  const { nativeEvent } = event;

                  if (isKeyHotkey('left', nativeEvent)) {
                    event.preventDefault();
                    Transforms.move(editor, { unit: 'offset', reverse: true });
                    return;
                  }
                  if (isKeyHotkey('right', nativeEvent)) {
                    event.preventDefault();
                    Transforms.move(editor, { unit: 'offset' });
                  }
                }
              }}
              onPaste={(event) => {
                if (!useRichEditor) {
                  event.preventDefault();
                  editor.insertText(event.clipboardData?.getData('Text'));
                }
              }}
            />
          </div>
        </Slate>
        {!!counter && (
          <Counter
            current={characters}
            limit={counter}
            showRecommendationNote={type === 'subject' || type === 'landingMessage'}
          />
        )}
      </div>
      {hasError && <p className="absolute bottom-2 text-red-600">{content.errors[`${type}Required`]}</p>}
    </div>
  );
};

RichText.propTypes = {
  type: PropTypes.string.isRequired,
  useRichEditor: PropTypes.bool,
  minHeight: PropTypes.string,
  label: PropTypes.shape({}),
  autoFocus: PropTypes.bool,
  setValue: PropTypes.func,
  counter: PropTypes.number,
};

RichText.defaultProps = {
  useRichEditor: true,
  minHeight: '',
  label: null,
  autoFocus: false,
  setValue: () => {},
  counter: 0,
};

export default RichText;
