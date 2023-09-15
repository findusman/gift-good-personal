const getGlobalTemplateData = (req, res) => {
  return {
    session: req.session,
    ability: req.ability,
    i18n: res,
  }
}

module.exports = {
  getGlobalTemplateData
};