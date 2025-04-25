
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

const categories = [
  { value: "rh", label: "Recursos Humanos" },
  { value: "comercial", label: "Comercial" },
  { value: "producao", label: "Produção" },
  { value: "ti", label: "Tecnologia da Informação" },
  { value: "financeiro", label: "Financeiro" },
  { value: "outro", label: "Outro" },
];

const ReportForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    isAnonymous: true,
    name: "",
    email: "",
    phone: "",
    hasEvidence: false,
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    // Simulação de envio
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast({
        title: "Denúncia enviada com sucesso",
        description: "Sua denúncia foi registrada e será analisada em breve.",
      });
      
      // Redirecionamento para a página inicial
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-audit-primary mb-2">Formulário de Denúncia</h1>
            <p className="text-lg text-gray-600">
              Preencha o formulário abaixo para registrar uma denúncia.{" "}
              {formData.isAnonymous ? (
                <span className="text-audit-secondary font-medium">Você está fazendo uma denúncia anônima.</span>
              ) : (
                <span>Suas informações pessoais serão mantidas em sigilo.</span>
              )}
            </p>
          </div>
          
          <Card className="shadow-md">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Detalhes da Denúncia</CardTitle>
                <CardDescription>
                  Forneça informações sobre a situação que deseja denunciar. 
                  Os campos marcados com * são obrigatórios.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Tipo de denúncia */}
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <Checkbox 
                    id="isAnonymous" 
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("isAnonymous", checked as boolean)
                    }
                  />
                  <Label htmlFor="isAnonymous" className="font-medium">
                    Fazer denúncia anônima
                  </Label>
                </div>
                
                {/* Informações da denúncia */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Título da Denúncia *
                      </Label>
                      <Input 
                        id="title"
                        name="title"
                        placeholder="Resumo breve da denúncia"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Categoria *
                      </Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleSelectChange("category", value)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Descrição Detalhada *
                    </Label>
                    <Textarea 
                      id="description"
                      name="description"
                      placeholder="Descreva detalhadamente a situação, incluindo datas, locais e pessoas envolvidas."
                      className="min-h-[150px]"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hasEvidence" 
                        checked={formData.hasEvidence}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange("hasEvidence", checked as boolean)
                        }
                      />
                      <Label htmlFor="hasEvidence">
                        Tenho evidências para anexar (fotos, documentos, etc.)
                      </Label>
                    </div>
                    
                    {formData.hasEvidence && (
                      <div className="pt-3">
                        <Label htmlFor="files" className="block mb-2">
                          Anexar Arquivos
                        </Label>
                        <Input 
                          id="files"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Formatos aceitos: JPG, PNG, PDF, DOCX, XLSX. Tamanho máximo: 10MB por arquivo.
                        </p>
                        
                        {files && files.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Arquivos selecionados:</p>
                            <ul className="text-xs text-gray-500 list-disc list-inside">
                              {Array.from(files).map((file, idx) => (
                                <li key={idx}>{file.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informações de contato (se não for anônimo) */}
                {!formData.isAnonymous && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Suas Informações</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name"
                          name="name"
                          placeholder="Seu nome completo"
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex-col space-y-4">
                <p className="text-sm text-gray-500 w-full">
                  Ao enviar este formulário, você concorda com nossa{" "}
                  <a href="#" className="text-audit-primary hover:underline">Política de Privacidade</a>{" "}
                  e{" "}
                  <a href="#" className="text-audit-primary hover:underline">Termos de Uso</a>.
                </p>
                
                <div className="flex justify-end w-full">
                  <Button 
                    type="submit" 
                    className="bg-audit-primary hover:bg-audit-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Denúncia"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportForm;
