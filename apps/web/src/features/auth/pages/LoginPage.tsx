import AuthLayout from '@/shared/components/layout/AuthLayout';
import LoginForm from '../forms/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
