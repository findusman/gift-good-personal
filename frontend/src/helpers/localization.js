import content from 'data/content.json';

const getByStringPath = (path, obj) => {
  const properties = Array.isArray(path) ? path : path.split('.');

  return properties.reduce((prev, curr) => prev?.[curr], obj);
};
const t = (translationKey, options) => {
  let translation = getByStringPath(translationKey, content) || translationKey;
  const replace = ({ key, replacement }) => {
    const variable = `{{${key}}}`;

    if (translation.indexOf(variable) > -1) {
      translation = translation.replaceAll(variable, replacement);
    }
  };

  if (options) {
    if (Array.isArray(options)) {
      options.map(replace);
    } else {
      replace(options);
    }
  }

  return translation;
};

export default t;
