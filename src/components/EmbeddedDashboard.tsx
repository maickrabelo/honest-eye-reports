
import React from 'react';
import { Card } from "@/components/ui/card";

interface EmbeddedDashboardProps {
  companyId: string;
}

const EmbeddedDashboard = ({ companyId }: EmbeddedDashboardProps) => {
  return (
    <Card className="w-full h-[calc(100vh-12rem)] overflow-hidden">
      <iframe 
        src={`/company-dashboard/${companyId}`}
        className="w-full h-full border-none"
        title="Company Dashboard"
      />
    </Card>
  );
};

export default EmbeddedDashboard;
