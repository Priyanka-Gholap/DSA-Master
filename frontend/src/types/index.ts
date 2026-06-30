export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

export interface UserUpdateResponse {
  status: string;
  data: {
    user: User;
  };
}
