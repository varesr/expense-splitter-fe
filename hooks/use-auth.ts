'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth-service';
import type { LoginRequest, LoginResponse } from '@/types/auth';

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: ({ username, password }) =>
      authService.login(username, password),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery<LoginResponse, Error>({
    queryKey: ['currentUser'],
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
