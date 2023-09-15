import { useCallback } from 'react';
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
  password: string().required(),
}).required();

const useLogin = () => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = useCallback(
    async (data) => {
      try {
        dispatch(setIsLoading({ loading: true }));
        const response = await fetchLocalApi({
          method: 'post',
          url: `auth/login`,
          body: JSON.stringify(data),
        });

        dispatch(setIsLoading({ loading: false }));

        if (!response.data || response.data?.status === 'failed') {
          dispatch(
            setError({
              title: content.common.errorTitle,
              content: response.data?.msg ?? content.common.errorMessage,
            }),
          );
        }

        if (response.data?.status === 'success') {
          reset();
          window.location.href = '/';
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
    getValues,
  };
};

export default useLogin;
