
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CompanyRegistrationForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="companyName">Nome da Empresa</Label>
          <Input id="companyName" placeholder="Nome da empresa" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" placeholder="00.000.000/0000-00" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(00) 0000-0000" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" placeholder="Endereço completo" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="employees">Quantidade de Colaboradores</Label>
          <Input id="employees" type="number" placeholder="0" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="techResponsible">Nome do Responsável Técnico</Label>
          <Input id="techResponsible" placeholder="Nome completo" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="techPhone">Telefone do Responsável Técnico</Label>
          <Input id="techPhone" placeholder="(00) 0000-0000" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="companyEmail">Email</Label>
          <Input id="companyEmail" type="email" placeholder="contato@empresa.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="companyPassword">Senha inicial</Label>
          <Input id="companyPassword" type="password" placeholder="********" required />
        </div>
      </div>
      <Button type="submit" className="w-full bg-green-700 hover:bg-green-800">
        Adicionar Empresa
      </Button>
    </form>
  );
};

export default CompanyRegistrationForm;
