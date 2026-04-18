import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Building2, Users, AlertCircle } from "lucide-react";

export interface SurveyDepartment {
  id?: string;
  tempId?: string;
  name: string;
  employee_count: number;
  order_index: number;
  isDeleted?: boolean;
}

interface DepartmentManagerProps {
  departments: SurveyDepartment[];
  onChange: (departments: SurveyDepartment[]) => void;
  /** Total active employees configured for the company (from companies.employee_count) */
  companyEmployeeCount?: number;
}

export interface DepartmentManagerHandle {
  /**
   * Validates allocation. Returns:
   *  - { ok: true } -> safe to save
   *  - { ok: false, reason: 'overflow' } -> blocked, sum > total
   *  - { ok: false, reason: 'unallocated', remaining } -> caller should confirm with user
   */
  validateAllocation: () => { ok: true } | { ok: false; reason: "overflow" } | { ok: false; reason: "unallocated"; remaining: number };
}

/**
 * Confirmation dialog used by parent screens before saving when there are
 * unallocated employees. Exported as a helper so each form can wire it up.
 */
export function UnallocatedEmployeesDialog({
  open,
  onOpenChange,
  remaining,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remaining: number;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Colaboradores não considerados
          </AlertDialogTitle>
          <AlertDialogDescription>
            {remaining} colaborador{remaining !== 1 ? "es" : ""} não{" "}
            {remaining !== 1 ? "estão" : "está"} sendo considerado
            {remaining !== 1 ? "s" : ""} na estrutura da empresa. Continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const DepartmentManager = forwardRef<DepartmentManagerHandle, DepartmentManagerProps>(
  function DepartmentManager({ departments, onChange, companyEmployeeCount = 0 }, ref) {
    const [newDeptName, setNewDeptName] = useState("");
    const [newDeptCount, setNewDeptCount] = useState("");

    const activeDepartments = departments.filter((d) => !d.isDeleted);
    const totalAllocated = activeDepartments.reduce((sum, d) => sum + d.employee_count, 0);
    const remaining = Math.max(0, companyEmployeeCount - totalAllocated);
    const overflow = totalAllocated > companyEmployeeCount;
    const hasCompanyTotal = companyEmployeeCount > 0;

    useImperativeHandle(ref, () => ({
      validateAllocation: () => {
        if (!hasCompanyTotal) return { ok: true };
        if (overflow) return { ok: false, reason: "overflow" };
        if (remaining > 0) return { ok: false, reason: "unallocated", remaining };
        return { ok: true };
      },
    }));

    const handleAddDepartment = () => {
      if (!newDeptName.trim()) return;

      const newDept: SurveyDepartment = {
        tempId: `dept-${Date.now()}`,
        name: newDeptName.trim(),
        employee_count: parseInt(newDeptCount) || 0,
        order_index: activeDepartments.length,
      };

      onChange([...departments, newDept]);
      setNewDeptName("");
      setNewDeptCount("");
    };

    const handleRemoveDepartment = (index: number) => {
      const dept = activeDepartments[index];
      if (dept.id) {
        onChange(departments.map((d) => (d.id === dept.id ? { ...d, isDeleted: true } : d)));
      } else {
        onChange(departments.filter((d) => d.tempId !== dept.tempId));
      }
    };

    const handleUpdateDepartment = (index: number, field: "name" | "employee_count", value: string) => {
      const dept = activeDepartments[index];
      const updatedValue = field === "employee_count" ? parseInt(value) || 0 : value;

      onChange(
        departments.map((d) => {
          if ((d.id && d.id === dept.id) || (d.tempId && d.tempId === dept.tempId)) {
            return { ...d, [field]: updatedValue };
          }
          return d;
        })
      );
    };

    const remainingTone = overflow
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : remaining === 0
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Estrutura da Empresa
          </CardTitle>
          <CardDescription>
            Configure os setores/departamentos da empresa e a quantidade de colaboradores em cada um
          </CardDescription>

          {hasCompanyTotal && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                Empresa: {companyEmployeeCount} colaborador{companyEmployeeCount !== 1 ? "es" : ""}
              </Badge>
              <Badge variant="outline" className={remainingTone}>
                {overflow
                  ? `Excesso: ${totalAllocated - companyEmployeeCount}`
                  : `Restantes: ${remaining}`}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new department */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nome do setor (ex: Comercial, TI, RH...)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                placeholder="Qtd."
                min="0"
                value={newDeptCount}
                onChange={(e) => setNewDeptCount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
              />
            </div>
            <Button type="button" onClick={handleAddDepartment} variant="secondary">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {overflow && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                A soma de colaboradores nos setores ({totalAllocated}) excede o total da empresa (
                {companyEmployeeCount}). Ajuste os valores antes de salvar.
              </div>
            </div>
          )}

          {/* Department list */}
          {activeDepartments.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Setores configurados:</Label>
              <div className="border rounded-lg divide-y">
                {activeDepartments.map((dept, index) => (
                  <div key={dept.id || dept.tempId} className="flex items-center gap-2 p-3">
                    <div className="flex-1">
                      <Input
                        value={dept.name}
                        onChange={(e) => handleUpdateDepartment(index, "name", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="w-24 flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={dept.employee_count}
                        onChange={(e) => handleUpdateDepartment(index, "employee_count", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDepartment(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-muted-foreground">
                  {activeDepartments.length} setor{activeDepartments.length !== 1 ? "es" : ""} configurado
                  {activeDepartments.length !== 1 ? "s" : ""}
                </span>
                <span className="font-medium">
                  Alocados: {totalAllocated} colaborador{totalAllocated !== 1 ? "es" : ""}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum setor configurado</p>
              <p className="text-xs">Adicione os setores da empresa acima</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
