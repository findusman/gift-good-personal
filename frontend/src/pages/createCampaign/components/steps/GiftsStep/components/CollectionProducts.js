import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { fetchProducts } from 'store/createCampaign/products/productsSlice';
import { resetPaymentStep } from 'store/createCampaign/payment/paymentSlice';
import { Container } from 'components/layout';
import content from 'data/content.json';
import ProductCard from './ProductCard';

const CollectionProducts = () => {
  const dispatch = useDispatch();
  const {
    products,
    currentCollection,
    collectionDialogVisible,
    collectionType,
    collectionId,
    loadedCollectionId,
    hasMore,
    page,
    productsLoaded,
  } = useSelector((state) => {
    return {
      products: state.products.data,
      productsLoaded: state.products.status === 'succeeded',
      loadedCollectionId: state.products.collectionId,
      collectionId: state.collection.currentCollection.id,
      currentCollection: state.collection.currentCollection,
      collectionDialogVisible: state.collection.dialogVisible,
      collectionType: state.collection.currentCollection.type,
      hasMore: state.products.hasMore,
      page: state.products.page,
    };
  });
  const isLoaded = (requestedCollectionId, reqPage) => {
    return requestedCollectionId === loadedCollectionId && reqPage === page && productsLoaded;
  };
  useEffect(() => {
    if (collectionId && collectionType && !collectionDialogVisible && !isLoaded(collectionId, page)) {
      dispatch(fetchProducts({ collectionId, collectionType }));
      dispatch(resetPaymentStep());
    }
  }, [collectionId]);

  if (!products) {
    return null;
  }

  return (
    <section className="pb-12 mb-16 w-full">
      <Container>
        <h2 className="text-1.5xl md:text-2.6xl mt-10.5 md:mt-[5vh] mb-5 md:mb-12 pb-3 border-b border-beige-dark">
          {currentCollection.titleLong}
        </h2>
        {products.length ? (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-[30px] gap-y-10 md:gap-y-[50px]">
            {products.map((product) => (
              <ProductCard product={product} collectionTitle={currentCollection.titleLong} key={product.product_id} />
            ))}
          </ul>
        ) : (
          <p>{content.errors.productsError}</p>
        )}
        {hasMore && (
          <button
            className="btn-secondary mx-auto mt-10 md:mt-12.5 block"
            type="button"
            onClick={() => dispatch(fetchProducts({ collectionId, page: page + 1 }))}
          >
            {content.common.viewMore}
          </button>
        )}
      </Container>
    </section>
  );
};

export default CollectionProducts;
