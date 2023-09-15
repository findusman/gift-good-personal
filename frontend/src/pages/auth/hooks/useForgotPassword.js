import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string } from 'yup';

import { fetchLocalApi } from 'helpers/fetchData';
import { setIsLoading } from 'store/common/app/appSlice';
import { setError } from 'store/common/error/errorSlice';
import content from 'data/content-auth.json';

const validationSchema = object({
  email: string().email().required(),
}).required();

const useForgotPassword = () => {
  const dispatch = useDispatch();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
    criteriaMode: 'all',
  });

  const onSubmit = useCallback(
    async (data) => {
      try {
        dispatch(setIsLoading({ loading: true }));
        const response = await fetchLocalApi({
          method: 'post',
          url: `auth/forgot-password`,
          body: JSON.stringify({
            email: data.email,
          }),
        });

        dispatch(setIsLoading({ loading: false }));

        if (!response.data || response.data?.status === 'failed') {
          dispatch(
            setError({
              title: content.common.errorTitle,
              content: content.common.errorMessage,
            }),
          );
        }

        if (response.data?.status === 'success') {
          reset();
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
    },
    [reset],
  );

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isDialogVisible,
    setIsDialogVisible,
  };
};

export default useForgotPassword;
