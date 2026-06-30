import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Get the route to redirect back to, defaulting to /dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await login(data);
      toast('Signed in successfully! Welcome back.', 'success');
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-heading font-bold text-lg text-white">Sign In</h3>
        <p className="text-xs text-slate-450">Access your Java DSA Dashboard</p>
      </div>

      {errorMessage && (
        <Alert variant="danger" message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <Input
          {...register('email')}
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4.5 w-4.5 text-slate-500" />}
          error={errors.email?.message}
          disabled={loading}
          autoComplete="email"
        />

        {/* Password */}
        <Input
          {...register('password')}
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4.5 w-4.5 text-slate-500" />}
          error={errors.password?.message}
          disabled={loading}
          autoComplete="current-password"
        />

        {/* Action Button */}
        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
          Sign In
        </Button>
      </form>

      {/* Redirect Footer */}
      <div className="text-center text-xs text-slate-400 font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-400 hover:text-indigo-350 transition-colors">
          Sign Up
        </Link>
      </div>
    </div>
  );
};
