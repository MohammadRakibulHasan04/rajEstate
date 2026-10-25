import React from 'react';
import { usePath, matchRoute } from '../lib/router';
import { AdminGate } from '../components/manage/AdminGate';
import { ManageDashboard } from './manage/Dashboard';
import { ListingEditor } from './manage/Editor';

export const ManagePage: React.FC = () => {
  const path = usePath();

  // Sub-routes under /manage:
  // 1. /manage/new -> create
  // 2. /manage/edit/:id -> edit
  // 3. /manage -> dashboard
  const editMatch = matchRoute('/manage/edit/:id', path);
  const isNew = path === '/manage/new';

  return (
    <AdminGate>
      {isNew ? (
        <ListingEditor />
      ) : editMatch?.id ? (
        <ListingEditor id={editMatch.id} />
      ) : (
        <ManageDashboard />
      )}
    </AdminGate>
  );
};
