import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';

const MainLayout = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard',   path: '/dashboard',  icon: 'dashboard'           },
    { name: 'Patients',    path: '/patients',   icon: 'groups'              },
    { name: 'Encounters',  path: '/encounters', icon: 'local_hospital'      },
    { name: 'Triage IGD',  path: '/triage',     icon: 'emergency'           },
    { name: 'EMR (SOAP)',  path: '/emr',        icon: 'medical_information' },
  ];

  return (
    <div className="flex-column h-full">
      <TopAppBar />
      <div className="flex-row" style={{ marginTop: '4rem', height: 'calc(100vh - 4rem)' }}>
        
        {/* Sidebar Navigation */}
        <div style={{ width: '240px', backgroundColor: 'var(--surface-container-low)', padding: '1rem', borderRight: '1px solid var(--outline-variant)' }}>
          <div className="flex-column gap-2 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
                    textDecoration: 'none', borderRadius: 'var(--radius-md)',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                    backgroundColor: isActive ? 'var(--primary-container)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="material-symbols-outlined mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Konten Utama */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--background)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
