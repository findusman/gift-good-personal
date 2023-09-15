import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, ref, string } from 'yup';

import { fetchLocalApi } from 'helpers/fetchData';
import { setIsLoading } from 'store/common/app/appSlice';
import { setError } from 'store/common/error/errorSlice';
import content from 'data/content-auth.json';

const validationSchema = object({
  password: string()
    .required('required')
    .min(8, 'atLeast8Characters')
    .matches(/(?=.*[a-z])/, 'atLeast1LowerCase')
    .matches(/(?=.*[A-Z])/, 'atLeast1UpperCase')
    .matches(/(?=.*[0-9])/, 'atLeast1Number'),
  confirmPassword: string()
    .required()
    .oneOf([ref('password')], content.common.passwordNotMatch),
}).required();

const useResetPassword = () => {
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
    async ({ password }) => {
      try {
        dispatch(setIsLoading({ loading: true }));
        const response = await fetchLocalApi({
          method: 'post',
          url: `auth/reset-password`,
          body: JSON.stringify({
            password,
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

export default useResetPassword;
