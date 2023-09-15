/* eslint-disable no-underscore-dangle */
import React from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));

const pageMap = {
  CREATE_CAMPAIGN: React.lazy(() => import('pages/createCampaign')),
  EDIT_CAMPAIGN: React.lazy(() => import('pages/editCampaign')),
  AUTH: React.lazy(() => import('pages/auth')),
};

const page = window.__PAGE;
if (page && pageMap[page]) {
  const PageComponent = pageMap[page];
  root.render(<PageComponent />);
} else {
  console.error("You haven't defined a correct PAGE type.");
}
