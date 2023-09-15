import React from 'react';
import PropTypes from 'prop-types';
import { Disclosure, Transition } from '@headlessui/react';

const ProductTab = ({ title, defaultOpen, children }) => {
  return (
    <Disclosure as="div" defaultOpen={defaultOpen} className="product-tab border-b border-beige-600 py-6.5">
      {({ open }) => (
        <>
          <Disclosure.Button className="flex justify-between w-full text-2xl font-crimsonpro md:text-3xl">
            <span>{title}</span>
            <span>{open ? '–' : '+'}</span>
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="mt-6.5">{children}</Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

ProductTab.propTypes = {
  title: PropTypes.string.isRequired,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

ProductTab.defaultProps = {
  defaultOpen: false,
};

export default ProductTab;
