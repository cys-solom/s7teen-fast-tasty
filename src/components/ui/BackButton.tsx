import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // يرجع للصفحة السابقة
  };

  return (
    <button
      onClick={goBack}
      className={`flex items-center gap-2 text-gray-700 hover:text-primary bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 ${className}`}
      aria-label="العودة للخلف"
    >
      <ArrowRight size={18} className="text-primary" />
      <span className="font-medium">العودة</span>
    </button>
  );
};

export default BackButton;