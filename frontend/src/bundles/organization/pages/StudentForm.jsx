import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DynamicForm from '../../../shared/components/DynamicForm';

// Example API methods (replace with actual API calls)
const getStudent = async (id) => {
  // Mock API call
  return { id, firstName: 'John', lastName: 'Doe', email: 'john@example.com', department: 'engineering' };
};

const saveStudent = async (studentData) => {
  // Mock API call
  console.log('Saving student data:', studentData);
  return { success: true, data: { id: '123', ...studentData } };
};

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [student, setStudent] = useState({});
  const isEditMode = !!id;

  useEffect(() => {
    // Load student data if in edit mode
    if (isEditMode) {
      const loadStudent = async () => {
        setLoading(true);
        try {
          const data = await getStudent(id);
          setStudent(data);
        } catch (error) {
          console.error('Error loading student:', error);
        } finally {
          setLoading(false);
        }
      };

      loadStudent();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (formData) => {
    try {
      const result = await saveStudent({
        ...formData,
        id: isEditMode ? id : undefined,
      });

      if (result.success) {
        navigate('/organization/students');
      }
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  // Form schema
  const formSchema = [
    {
      id: 'firstName',
      type: 'text',
      label: 'First Name',
      required: true,
    },
    {
      id: 'lastName',
      type: 'text',
      label: 'Last Name',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email',
      required: true,
    },
    {
      id: 'phone',
      type: 'text',
      label: 'Phone Number',
    },
    {
      id: 'department',
      type: 'select',
      label: 'Department',
      required: true,
      options: [
        { value: 'engineering', label: 'Engineering' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Sales' },
        { value: 'hr', label: 'Human Resources' },
      ],
    },
    {
      id: 'position',
      type: 'text',
      label: 'Position',
    },
    {
      id: 'joinDate',
      type: 'date',
      label: 'Join Date',
    },
    {
      id: 'notes',
      type: 'textarea',
      label: 'Additional Notes',
    },
    {
      id: 'active',
      type: 'checkbox',
      label: 'Active',
    },
  ];

  if (loading) {
    return <div>Loading student data...</div>;
  }

  return (
    <div className="student-form-container">
      <h1>{isEditMode ? 'Edit Student' : 'Add New Student'}</h1>

      <DynamicForm
        schema={formSchema}
        initialValues={student}
        onSubmit={handleSubmit}
        submitLabel={isEditMode ? 'Update Student' : 'Add Student'}
      />
    </div>
  );
};

export default StudentForm; 