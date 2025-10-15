import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    onClose(); // Close the modal
    navigate(`/signup?role=${role}`); // Pass role as URL parameter
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

      {/* Modal Content */}
      <div 
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6 p-8 bg-white min-w-[340px] sm:min-w-96 border rounded-xl shadow-2xl relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
            aria-label="Close modal"
          >
            ×
          </button>

          {/* Title */}
          <div className="text-center mt-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Choose Your Role
            </h2>
            <p className="text-gray-600 text-sm">
              Select how you want to use Law Aid
            </p>
          </div>

          {/* Role Selection Buttons */}
          <div className="flex flex-col gap-4 w-full mt-2">
            <button
              onClick={() => handleRoleSelect('client')}
              className="w-full bg-brownBG hover:bg-brownforhover text-white px-6 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              I am a Client
            </button>
            
            <button
              onClick={() => handleRoleSelect('lawyer')}
              className="w-full bg-brownBG hover:bg-brownforhover text-white px-6 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              I am a Lawyer
            </button>
          </div>

          {/* Back to Login */}
          <p className="text-center text-gray-600 text-sm mt-2">
            Already have an account?{' '}
            <span
              onClick={onClose}
              className="text-brownBG cursor-pointer underline hover:text-brownforhover font-semibold"
            >
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;