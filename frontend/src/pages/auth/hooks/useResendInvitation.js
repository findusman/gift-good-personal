import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { fetchLocalApi } from 'helpers/fetchData';
import { setIsLoading } from 'store/common/app/appSlice';
import { setError } from 'store/common/error/errorSlice';
import content from 'data/content-auth.json';

const useResendInvitation = (getValues) => {
  const dispatch = useDispatch();
  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const handleResendInvitation = useCallback(async () => {
    try {
      const { email } = getValues();

      if (!email) {
        dispatch(
          setError({
            title: content.signIn.resentInvitationError,
            content: content.common.errorNoEmail,
          }),
        );
        return;
      }

      dispatch(setIsLoading({ loading: true }));
      const response = await fetchLocalApi({
        method: 'post',
        url: `auth/resent-verification`,
        body: JSON.stringify({
          email,
        }),
      });

      dispatch(setIsLoading({ loading: false }));

      if (!response.data || response.data?.status === 'failed') {
        dispatch(
          setError({
            title: content.signIn.resentInvitationError,
            content: response.data?.msg ?? content.common.errorNoEmail,
          }),
        );
      }

      if (response.data?.status === 'success') {
        setIsDialogVisible(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      dispatch(setIsLoading({ loading: false }));
      dispatch(
        setError({
          title: content.common.errorTitle,
          content: content.common.errorMessage,
        }),
      );
    }
  }, [getValues]);

  return { handleResendInvitation, isDialogVisible, setIsDialogVisible };
};

export default useResendInvitation;
