import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { bool, object, ref, string } from 'yup';

import { fetchLocalApi } from 'helpers/fetchData';
import { setIsLoading } from 'store/common/app/appSlice';
import { setError } from 'store/common/error/errorSlice';
import content from 'data/content-auth.json';

const validationSchema = object({
  firstName: string().required(),
  lastName: string().required(),
  email: string().email().required(),
  job: string().required(),
  company: string().required(),
  password: string()
    .required('required')
    .min(8, 'atLeast8Characters')
    .matches(/(?=.*[a-z])/, 'atLeast1LowerCase')
    .matches(/(?=.*[A-Z])/, 'atLeast1UpperCase')
    .matches(/(?=.*[0-9])/, 'atLeast1Number'),
  confirmPassword: string()
    .required()
    .oneOf([ref('password')], content.common.passwordNotMatch),
  agreement: bool().oneOf([true], 'Checkbox selection is required'),
}).required();

const useRegister = () => {
  const dispatch = useDispatch();
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
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
          url: `auth/register`,
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            ...data,
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
          window.location.href = '/welcome';
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
    isAgreementChecked,
    setIsAgreementChecked,
    getValues,
  };
};

export default useRegister;
