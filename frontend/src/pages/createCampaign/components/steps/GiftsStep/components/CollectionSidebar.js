import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RadioGroup } from '@headlessui/react';

import arrowSelect from 'assets/images/arrow_select.svg';

import BaseDialog from 'components/common/BaseDialog';
import { setCurrentCollection, setCollectionDialogVisibility } from 'store/createCampaign/collection/collectionSlice';
import content from 'data/content.json';

const PanelContent = () => {
  const dispatch = useDispatch();
  // use state by default and update Redux values on click 'Done' button to avoid products update without confirmation
  const currentCollection = useSelector((state) => state.collection.currentCollection);
  const [type, setCollection] = useState(currentCollection.type || 'gifts');
  const {
    collectionTypes,
    defaultCollectionId,
    defaultCharityCollectionId,
    defaultIntlCollectionId,
    collections,
    currentCollectionId,
  } = useSelector((state) => ({
    currentCollectionId: state.collection.currentCollection.id,
    defaultCollectionId: state.collection.defaultCollectionId,
    defaultCharityCollectionId: state.collection.defaultCharityCollectionId,
    defaultIntlCollectionId: state.collection.defaultIntlCollectionId,
    collectionTypes: state.collection.types.filter(
      (collectionType) => state.collection.collections.data.filter((item) => item.type === collectionType.key).length,
    ),
    collections: state.collection.collections.data.filter((item) => item.type === type),
  }));
  const [collectionId, setCollectionId] = useState(currentCollectionId || defaultCollectionId);
  const setNewCollection = () => {
    const current = collections.find((el) => el.shopify_id === collectionId) || collections[0];
    dispatch(setCollectionDialogVisibility(false));
    dispatch(
      setCurrentCollection({
        id: current.shopify_id,
        title: current.title,
        titleShort: current.title_short,
        titleLong: current.title_long,
        titleDropdown: current.title_dropdown,
        price: current.price,
        type,
      }),
    );
  };
  const handleSelectType = (value) => {
    let defaultId = defaultCollectionId;

    if (value === 'donation') {
      defaultId = defaultCharityCollectionId;
    } else if (value === 'international') {
      defaultId = defaultIntlCollectionId;
    }
    setCollectionId(defaultId);
    setCollection(value);
  };
  const handleSelectCampaign = (event) => {
    setCollectionId(event.target.value);
  };
  const formatDropdownPrice = ({ title_dropdown: titleDropdown, price }) => titleDropdown || `$${price}`;

  return (
    <>
      <h2 className="heading-1">{content.giftsStep.collectionAmountModal.title}</h2>
      <p className="mt-5 2xl:mt-8 font-lato text-base">{content.giftsStep.collectionAmountModal.description}</p>
      <div className="mt-10.5">
        <RadioGroup value={type} onChange={handleSelectType}>
          {collectionTypes.map((item) => (
            <RadioGroup.Option className="mt-12 flex" value={item.key} key={item.key}>
              {({ checked }) => (
                <>
                  <span
                    className="mr-4 mt-1 border border-black relative rounded-full"
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                    }}
                  >
                    {checked && (
                      <span
                        className="absolute top-0.5 left-0.5 bg-black rounded-full"
                        style={{
                          width: '12px',
                          height: '12px',
                        }}
                      />
                    )}
                  </span>
                  <div className="content">
                    <strong className="block font-lato text-lg">{item.title}</strong>
                    <span className="block font-lato text-base">{item.description}</span>
                    {checked && (
                      <select
                        onChange={handleSelectCampaign}
                        className="mt-5 py-2 px-3 border border-black font-lato text-base"
                        value={collectionId}
                        style={{
                          minWidth: '109px',
                          appearance: 'none',
                          backgroundImage: `url(${arrowSelect})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                        }}
                      >
                        {collections.map((collection) => (
                          <option value={collection.shopify_id} key={collection.shopify_id}>
                            {formatDropdownPrice(collection)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              )}
            </RadioGroup.Option>
          ))}
        </RadioGroup>
      </div>

      <button type="button" className="mt-12 2xl:mt-20 btn-primary" onClick={setNewCollection}>
        {content.common.done}
      </button>
    </>
  );
};

const CollectionSidebar = () => {
  const dispatch = useDispatch();
  const { visible } = useSelector((state) => ({
    visible: state.collection.dialogVisible,
  }));
  const handleClose = () => {
    dispatch(setCollectionDialogVisibility(false));
  };

  return <BaseDialog visible={visible} handleClose={handleClose} paddingY="py-28" panelContent={<PanelContent />} />;
};

export default CollectionSidebar;
