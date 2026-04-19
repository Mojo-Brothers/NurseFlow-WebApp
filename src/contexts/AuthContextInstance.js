import { createContext } from 'react';

/**
 * Shared Auth Context Instance.
 * Separated from Provider to allow Fast Refresh of the component
 * and to avoid circular dependencies with the useAuth hook.
 */
export const AuthContext = createContext(null);
