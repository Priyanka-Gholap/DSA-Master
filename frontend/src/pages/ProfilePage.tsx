import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User as UserIcon, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  avatar: z.string().max(2, 'Avatar should be 1-2 character initials').optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await updateProfile(data);
      toast('Profile updated successfully!', 'success');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Card: Summary Card */}
        <div className="md:col-span-1">
          <Card hoverEffect={false} className="border-slate-800 bg-slate-900/20">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-4">
              {/* Avatar display */}
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black border-2 border-indigo-500/30 shadow-lg">
                {user?.avatar ? user.avatar : user?.fullName.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base text-white">{user?.fullName}</h4>
                <p className="text-xs text-slate-400 truncate max-w-[200px]">{user?.email}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold pt-4">
                <Calendar className="h-4 w-4" />
                <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {month: 'long', year: 'numeric'}) : 'Recently'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Card: Form Card */}
        <div className="md:col-span-2">
          <Card hoverEffect={false} className="border-slate-800 bg-slate-900/10">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information and profile settings</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-2 space-y-6">
              {errorMessage && (
                <Alert variant="danger" message={errorMessage} onClose={() => setErrorMessage(null)} />
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <Input
                  {...register('fullName')}
                  label="Full Name"
                  placeholder="John Doe"
                  leftIcon={<UserIcon className="h-4.5 w-4.5 text-slate-500" />}
                  error={errors.fullName?.message}
                  disabled={loading}
                />

                {/* Email Address */}
                <Input
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4.5 w-4.5 text-slate-500" />}
                  error={errors.email?.message}
                  disabled={loading}
                />

                {/* Avatar Initials */}
                <Input
                  {...register('avatar')}
                  label="Avatar Initials"
                  placeholder="JD"
                  maxLength={2}
                  error={errors.avatar?.message}
                  disabled={loading}
                  className="uppercase tracking-widest font-bold"
                />

                {/* Save Button */}
                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" isLoading={loading} className="w-full sm:w-auto">
                    Save Changes
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
