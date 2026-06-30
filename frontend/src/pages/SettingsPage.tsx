import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await api.put('/user/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast('Password changed successfully!', 'success');
      reset();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
        Back to Dashboard
      </button>

      <div className="max-w-2xl">
        
        {/* Security settings (Change password) */}
        <div>
          <Card hoverEffect={false} className="border-slate-800 bg-slate-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                Security
              </CardTitle>
              <CardDescription>Manage password and protection keys</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-2 space-y-6">
              {errorMessage && (
                <Alert variant="danger" message={errorMessage} onClose={() => setErrorMessage(null)} />
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Current Password */}
                <Input
                  {...register('currentPassword')}
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4.5 w-4.5 text-slate-500" />}
                  error={errors.currentPassword?.message}
                  disabled={loading}
                />

                {/* New Password */}
                <Input
                  {...register('newPassword')}
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4.5 w-4.5 text-slate-500" />}
                  error={errors.newPassword?.message}
                  disabled={loading}
                />

                {/* Confirm New Password */}
                <Input
                  {...register('confirmNewPassword')}
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4.5 w-4.5 text-slate-500" />}
                  error={errors.confirmNewPassword?.message}
                  disabled={loading}
                />

                {/* Submit Action */}
                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" isLoading={loading} className="w-full sm:w-auto">
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
