import React from 'react';
import { enterpriseAuthService } from './enterpriseAuth.service.js';
import { rbacGuardService } from './rbacGuard.service.js';

export default function PermissionGate({ permission, fallback = null, children }) {
  const session = enterpriseAuthService.getCurrentSession();
  const isAllowed = rbacGuardService.hasPermission(session.role, permission);

  if (!isAllowed) {
    return fallback || (
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">lock</span>
        <span>Akses Dibatasi: Role Anda ({session.role}) tidak memiliki izin `{permission}`.</span>
      </div>
    );
  }

  return <>{children}</>;
}
