const moment = require('moment');
const { Op } = require('sequelize');

const parseHrtime = (time) => {
  const hrtime = process.hrtime(time);
  const timeInSeconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed();
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds - minutes * 60;
  return `${minutes} minutes ${seconds} seconds`;
};

const isLast24Hours = (date) => {
  if (!date) {
    return false;
  }
  const currentDate = moment();
  const dateToCompare = moment(date);
  const hoursDifference = currentDate.diff(dateToCompare, 'hours', true);

  return hoursDifference < 24 && hoursDifference >= 0;
};
// Adds PST timezone to provided datetime (doesnt change datetime value)
const useTimezone = (date, timezone) => {
  return date ? moment(date).tz(timezone || 'US/Pacific', true) : null;
}

// Converts datetime to PST and displays in MM/DD/YYYY hh:mm format
const formatToPSTTimezone = (date) => {
  return date ? moment(date).tz('US/Pacific').format('M/DD/YYYY hh:mm a') : null;
}

const priorToNowCondition = () => ({
  // temporarily limit to two days, but at some point
  // we will want to open this up
  [Op.gt]: moment().startOf('day').subtract(2, 'days'),
  [Op.lte]: moment(),
});

const todayPriorToNowCondition = () => ({
  [Op.gt]: moment.utc().hours(0).minutes(0).seconds(0),
  [Op.lte]: moment(),
});

const isPastDate = (date) => {
 return date && new Date(date).setHours(0, 0, 0, 0) <
    new Date().setHours(0, 0, 0, 0);
}

module.exports = {
  parseHrtime,
  isLast24Hours,
  useTimezone,
  formatToPSTTimezone,
  priorToNowCondition,
  todayPriorToNowCondition,
  isPastDate,
}