
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ReportChat as ReportChatContent } from '@/components/ReportChatContent';

const ReportChat = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-audit-primary mb-2">Nova Denúncia</h1>
          </div>
          <ReportChatContent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportChat;
