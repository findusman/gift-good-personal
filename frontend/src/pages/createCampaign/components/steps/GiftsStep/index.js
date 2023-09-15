import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import {
  setCollectionDialogVisibility,
  fetchCollections,
  setCurrentCollection,
  setCollectionLearnMoreVisibility,
} from 'store/createCampaign/collection/collectionSlice';
import arrowButton from 'assets/images/arrow_button.svg';
import TopSection from 'components/common/TopSection';
import content from 'data/content.json';
import CollectionProducts from './components/CollectionProducts';
import CollectionSidebar from './components/CollectionSidebar';

const TopSectionTitle = ({ currentCollection }) => {
  const dispatch = useDispatch();

  return (
    <div className="flex flex-col justify-center items-center max-w-[600px] 2xl:block 2xl:text-left text-center text-3.3xl font-crimsonpro text-2xl 2xl:text-5xl 2xl:flex-wrap">
      {content.giftsStep.mainPage.headingFirstPart}
      <button
        type="button"
        onClick={() => dispatch(setCollectionDialogVisibility(true))}
        className="my-2 2xl:ml-5 2xl:mr-5 border border-black rounded-full px-5 py-3 text-center font-lato text-1.5xl inline-flex items-center flex-nowrap align-text-top"
      >
        {currentCollection.titleShort}
        <img className="ml-3" src={arrowButton} alt="button arrow" />
      </button>
      {content.giftsStep.mainPage.headingSecondPart}
    </div>
  );
};

TopSectionTitle.propTypes = {
  currentCollection: PropTypes.shape({
    titleShort: PropTypes.string,
  }).isRequired,
};

const TopSectionContent = () => {
  const dispatch = useDispatch();
  const handleLearnMoreClick = () => {
    dispatch(setCollectionLearnMoreVisibility(true));
  };

  return (
    <p
      className="2xl:mt-6 mx-auto text-lg 2xl:text-1.5xl text-center 2xl:text-left flex flex-col 2xl:flex-row justify-center 2xl:justify-start items-center 2xl:items-start"
      style={{ maxWidth: '1100px' }}
    >
      {content.giftsStep.mainPage.description}
      <button
        type="button"
        className="ml-1 2xl:ml-3 mt-3 2xl:mt-0.5 text-lato text-base border-b border-black"
        onClick={handleLearnMoreClick}
      >
        {content.common.learnMore}
      </button>
    </p>
  );
};

const GiftsStep = () => {
  const dispatch = useDispatch();
  const { defaultCollectionId, currentCollection, collections } = useSelector((state) => {
    return {
      defaultCollectionId: state.collection.defaultCollectionId,
      collections: state.collection.collections.data,
      currentCollection: state.collection.currentCollection,
    };
  });
  const setNewCollection = (collectionId) => {
    const current = collections.find((el) => el.shopify_id === collectionId) || collections[0];
    dispatch(
      setCurrentCollection({
        id: current.shopify_id,
        title: current.title,
        titleShort: current.title_short,
        titleLong: current.title_long,
        titleDropdown: current.title_dropdown,
        price: current.price,
        type: current.type,
      }),
    );
  };

  useEffect(() => {
    if (!collections.length) {
      dispatch(fetchCollections());
    }
  }, []);

  useEffect(() => {
    if (collections && collections.length) {
      setNewCollection(currentCollection.id || defaultCollectionId);
    }
  }, [collections]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!collections || !collections.length) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <TopSection title={<TopSectionTitle currentCollection={currentCollection} />} content={<TopSectionContent />} />
      <CollectionProducts />
      <CollectionSidebar />
    </div>
  );
};

export default GiftsStep;
