import moment from 'moment';
import { string } from 'yup';

export const dateRule = ({ isRequired }) =>
  string().test('test-future-date', 'Please, enter a date in the future', (value) => {
    const requiredRule = isRequired ? false : !value;
    return requiredRule || (moment(value, 'YYYY-MM-DD').isValid() && moment(value).diff(moment()) > 0);
  });

export const timeRule = ({ isRequired }) =>
  string().test('test-time', 'Please, enter a valid time', (value) => {
    const requiredRule = isRequired ? false : !value;
    return requiredRule || moment(value, ['HH:MM', 'hh:mm']).isValid();
  });
