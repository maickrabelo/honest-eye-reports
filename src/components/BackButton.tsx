
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BackButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (user?.role === 'master') {
      navigate('/master-dashboard');
    } else if (user?.role === 'sst') {
      navigate('/sst-dashboard');
    }
  };

  return (
    <Button variant="ghost" onClick={handleBack} className="mb-4">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Voltar
    </Button>
  );
};

export default BackButton;
