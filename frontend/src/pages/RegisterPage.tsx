import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: signup, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signup(data);
      toast('Account created successfully! Welcome to DSA Master.', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-heading font-bold text-lg text-white">Create Account</h3>
        <p className="text-xs text-slate-450">Join premium Java DSA learning platform</p>
      </div>

      {errorMessage && (
        <Alert variant="danger" message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <Input
          {...register('fullName')}
          label="Full Name"
          type="text"
          placeholder="John Doe"
          leftIcon={<UserIcon className="h-4.5 w-4.5 text-slate-500" />}
          error={errors.fullName?.message}
          disabled={loading}
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />

        {/* Action Button */}
        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
          Get Started
        </Button>
      </form>

      {/* Redirect Footer */}
      <div className="text-center text-xs text-slate-400 font-medium">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-350 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};
