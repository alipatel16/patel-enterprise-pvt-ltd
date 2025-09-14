// src/routes/checklistRoutes.js
import { lazy } from 'react';

// Lazy load checklist components
const ChecklistsManagementPage = lazy(() => import('../pages/checklists/ChecklistsManagementPage'));
const CreateChecklistPage = lazy(() => import('../pages/checklists/CreateChecklistPage'));
const EditChecklistPage = lazy(() => import('../pages/checklists/EditChecklistPage'));
const EmployeeChecklistDashboard = lazy(() => import('../pages/checklists/EmployeeChecklistDashboard'));

// Define checklist routes
export const checklistRoutes = [
  // Admin routes
  {
    path: '/checklists',
    element: ChecklistsManagementPage,
    requiresAuth: true,
    requiredRole: 'admin',
    title: 'Checklists Management'
  },
  {
    path: '/checklists/create',
    element: CreateChecklistPage,
    requiresAuth: true,
    requiredRole: 'admin',
    title: 'Create Checklist'
  },
  {
    path: '/checklists/edit/:id',
    element: EditChecklistPage,
    requiresAuth: true,
    requiredRole: 'admin',
    title: 'Edit Checklist'
  },
//   {
//     path: '/checklists/reports',
//     element: ChecklistReportsPage,
//     requiresAuth: true,
//     requiredRole: 'admin',
//     title: 'Checklist Reports'
//   },
  // Employee routes
  {
    path: '/my-checklists',
    element: EmployeeChecklistDashboard,
    requiresAuth: true,
    requiredRole: 'employee',
    title: 'My Checklists'
  }
];

// Export default
export default checklistRoutes;