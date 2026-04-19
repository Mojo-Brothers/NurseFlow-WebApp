import { useContext } from 'react';
import { AuthContext } from './AuthContextInstance.js';

export function useAuth() {
  return useContext(AuthContext);
}
