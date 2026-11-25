import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

import { Button, Input, PasswordInput } from '@/shared/components/ui';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import RememberMe    from '../components/RemenberMe';

import { authService } from '../services/auth.services';
import { useAuthStore } from '@/store/authStore';

function getLoginErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const responseMessage = (
      error as { response?: { data?: { message?: unknown } } }
    ).response?.data?.message;

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage.trim();
    }
  }

  if (isAxiosError(error) && !error.response) {
    return "We couldn't reach ApexAssign. Check your connection and try again.";
  }

  return "We couldn't sign you in. Please try again.";
}

export default function LoginForm() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await authService.login({
        email:    data.email,
        password: data.password,
      });

      const { user, accessToken, refreshToken } = res.data;

      setAuth(user, accessToken, refreshToken);

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(getLoginErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='w-full'>
      <h1 className='text-xl font-semibold text-zinc-100'>Welcome back</h1>

      <p className='mt-1 text-sm text-zinc-400'>
        Sign in to your ApexAssign account.
      </p>

      <div className='mt-6 space-y-4'>
        <Input
          label='Email'
          placeholder='you@company.com'
          {...register('email')}
          error={errors.email?.message}
        />

        <PasswordInput
          label='Password'
          placeholder='••••••••'
          {...register('password')}
          error={errors.password?.message}
        />
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <RememberMe
          checked={watch('remember') ?? false}
          onChange={() => setValue('remember', !watch('remember'))}
        />

        <Link to='/forgot-password' className='text-sm text-orange-500 dark:text-orange-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'>
          Forgot password?
        </Link>
      </div>

      <Button type='submit' className='mt-6 w-full' loading={isSubmitting}>
        Log In
      </Button>
    </form>
  );
}
