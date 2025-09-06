import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { EmployeeProvider, useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Page Content Component
const AddEmployeePageContent = () => {
  const navigate = useNavigate();
  const { createEmployee, loading, error } = useEmployee();
  const { getDisplayName } = useUserType();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const breadcrumbs = [
    {
      label: 'Employees',
      path: '/employees'
    },
    {
      label: 'Add Employee',
      path: '/employees/add'
    }
  ];

  // Handle form submission
  const handleSubmit = async (employeeData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const newEmployee = await createEmployee(employeeData);
      
      if (newEmployee) {
        setSuccessMessage('Employee added successfully!');
        
        // Redirect to employee list after a short delay
        setTimeout(() => {
          navigate('/employees');
        }, 1500);
      } else {
        setSubmitError('Failed to add employee. Please try again.');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setSubmitError(error.message || 'Failed to add employee. Please try again.');
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate('/employees');
  };

  return (
    <Layout 
      title="Add New Employee" 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Employee Form */}
        <EmployeeForm
          isEdit={false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
        />
      </Box>
    </Layout>
  );
};

// Main Component with Provider
const AddEmployeePage = () => {
  return (
    <EmployeeProvider>
      <AddEmployeePageContent />
    </EmployeeProvider>
  );
};

export default AddEmployeePage;