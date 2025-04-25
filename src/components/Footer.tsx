
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-audit-primary text-white pt-10 pb-6">
      <div className="audit-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Honest Eyes</h3>
            <p className="text-sm opacity-80">
              Promovendo transparência e integridade nas organizações através de denúncias seguras e análise inteligente de dados.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="opacity-80 hover:opacity-100 transition-opacity">Início</Link></li>
              <li><Link to="/report" className="opacity-80 hover:opacity-100 transition-opacity">Fazer Denúncia</Link></li>
              <li><Link to="/login" className="opacity-80 hover:opacity-100 transition-opacity">Login</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <p className="text-sm opacity-80">
              Email: contato@honestype.com<br />
              Telefone: +55 (11) 3456-7890
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm opacity-70">
          <p>&copy; {new Date().getFullYear()} Honest Eyes. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
