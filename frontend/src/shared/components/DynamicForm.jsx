import React, { useState } from 'react';

/**
 * Dynamic Form Component
 * Renders a form based on a schema configuration
 * 
 * @param {Object} props
 * @param {Array} props.schema - Array of field configurations
 * @param {Object} props.initialValues - Initial values for the form
 * @param {Function} props.onSubmit - Submit handler function
 * @param {String} props.submitLabel - Label for the submit button
 */
const DynamicForm = ({
  schema = [],
  initialValues = {},
  onSubmit,
  submitLabel = 'Submit'
}) => {
  const [formState, setFormState] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (fieldId, value) => {
    setFormState(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear errors when field is changed
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    schema.forEach(field => {
      if (field.required && !formState[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }

      // Validate by field type
      if (field.type === 'email' && formState[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formState[field.id])) {
          newErrors[field.id] = 'Please enter a valid email';
        }
      }

      // Custom validator if provided
      if (field.validator && formState[field.id]) {
        const validationError = field.validator(formState[field.id], formState);
        if (validationError) {
          newErrors[field.id] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formState);
    }
  };

  const renderField = (field) => {
    const { id, type, label, placeholder, options } = field;
    const value = formState[id] || '';
    const error = errors[id];

    switch (type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <div className="form-field" key={id}>
            <label htmlFor={id}>{label}</label>
            <input
              id={id}
              type={type}
              value={value}
              placeholder={placeholder || ''}
              onChange={(e) => handleChange(id, e.target.value)}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );

      case 'textarea':
        return (
          <div className="form-field" key={id}>
            <label htmlFor={id}>{label}</label>
            <textarea
              id={id}
              value={value}
              placeholder={placeholder || ''}
              onChange={(e) => handleChange(id, e.target.value)}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );

      case 'select':
        return (
          <div className="form-field" key={id}>
            <label htmlFor={id}>{label}</label>
            <select
              id={id}
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
            >
              <option value="">Select {label}</option>
              {options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <div className="form-error">{error}</div>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="form-field checkbox" key={id}>
            <input
              id={id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(id, e.target.checked)}
            />
            <label htmlFor={id}>{label}</label>
            {error && <div className="form-error">{error}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      {schema.map(renderField)}

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default DynamicForm; 