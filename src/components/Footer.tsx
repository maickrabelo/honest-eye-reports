import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-audit-dark text-white">
      <div className="audit-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img 
              src="/lovable-uploads/b77f9a5e-5823-4448-99b1-897fb16908a1.png" 
              alt="SOIA Logo" 
              className="h-10 brightness-0 invert mb-4"
            />
            <p className="text-white/60 text-sm mb-6">
              Plataforma completa para canal de denúncias, pesquisa de clima e gestão de riscos psicossociais.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Soluções</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Canal de Denúncias
                </span>
              </li>
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Pesquisa de Clima
                </span>
              </li>
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Compliance NR-01
                </span>
              </li>
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Dashboard Analítico
                </span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Sobre Nós
                </span>
              </li>
              <li>
                <Link to="/auth" className="text-white/60 hover:text-white transition-colors">
                  Área do Cliente
                </Link>
              </li>
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Política de Privacidade
                </span>
              </li>
              <li>
                <span className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  Termos de Uso
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-audit-secondary flex-shrink-0 mt-0.5" />
                <span className="text-white/60">contato@soia.com.br</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-audit-secondary flex-shrink-0 mt-0.5" />
                <span className="text-white/60">+55 (11) 99999-9999</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-audit-secondary flex-shrink-0 mt-0.5" />
                <span className="text-white/60">São Paulo, SP - Brasil</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="audit-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} SOIA. Todos os direitos reservados.</p>
            <p>Desenvolvido com 💚 para empresas que cuidam das pessoas.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
