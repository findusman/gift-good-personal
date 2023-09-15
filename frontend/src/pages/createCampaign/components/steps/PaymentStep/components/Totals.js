import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import content from 'data/content.json';

const ListItem = ({ name, value, isTotal }) => (
  <>
    <dt className={classnames(`uppercase flex items-center text-xs font-bold ${isTotal ? '' : 'mb-5'}`)}>{name}</dt>
    <dd className={classnames(`text-right ${isTotal ? 'font-crimsonpro text-3xl' : 'text-lg mb-5'}`)}>{value}</dd>
  </>
);

ListItem.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  isTotal: PropTypes.bool,
};

ListItem.defaultProps = {
  isTotal: false,
};

const Totals = ({ collectionPrice, numberOfRecipients, amountToPay, useCredits }) => {
  const total = collectionPrice * numberOfRecipients;
  return (
    <div className="bg-beige-light p-4 pt-10 md:p-8 md:pt-10 min-w-[314px]">
      <dl className="grid grid-cols-2">
        <ListItem name="gift collection" value={`$${collectionPrice}`} />
        <ListItem name="gift recipients" value={numberOfRecipients} />
        <ListItem name="total" value={`$${total}`} />
        {useCredits && <ListItem name="Applied Credit" value={`-$${total - amountToPay}`} />}
        <hr className="mt-1 mb-6 border border-beige-dark" />
        <hr className="mt-1 mb-6 border border-beige-dark" />
        <ListItem name="Campaign Total" value={`$${amountToPay}`} isTotal />
      </dl>
      <hr className="mt-6 mb-6 border border-beige-dark" />
      <p className="text-center italic pt-4 mb-4 md:mb-1 md:pt-0">
        {content.paymentStep.paymentMethods.includeShipping}
      </p>
    </div>
  );
};

Totals.propTypes = {
  collectionPrice: PropTypes.number.isRequired,
  numberOfRecipients: PropTypes.number.isRequired,
  amountToPay: PropTypes.number.isRequired,
  useCredits: PropTypes.bool.isRequired,
};

export default Totals;
