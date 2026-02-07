import React, { useEffect, useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type SSTManager = {
  id: string;
  name: string;
};

interface SSTManagerSelectorProps {
  selectedIds: string[] | null;
  onChange: (ids: string[] | null) => void;
}

export const SSTManagerSelector: React.FC<SSTManagerSelectorProps> = ({ selectedIds, onChange }) => {
  const [managers, setManagers] = useState<SSTManager[]>([]);
  const [sendToAll, setSendToAll] = useState(selectedIds === null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('sst_managers').select('id, name').order('name');
      setManagers(data || []);
    };
    load();
  }, []);

  const handleToggleAll = (checked: boolean) => {
    setSendToAll(checked);
    onChange(checked ? null : []);
  };

  const handleToggleManager = (id: string, checked: boolean) => {
    const current = selectedIds || [];
    const next = checked ? [...current, id] : current.filter(i => i !== id);
    onChange(next.length === 0 ? null : next);
  };

  return (
    <div className="space-y-3">
      <Label>Destinatários</Label>
      <div className="flex items-center gap-2">
        <Checkbox
          id="sendToAll"
          checked={sendToAll}
          onCheckedChange={(checked) => handleToggleAll(!!checked)}
        />
        <Label htmlFor="sendToAll" className="font-normal cursor-pointer">
          Enviar para todas as gestoras
        </Label>
      </div>
      {!sendToAll && (
        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
          {managers.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <Checkbox
                id={`sst-${m.id}`}
                checked={selectedIds?.includes(m.id) || false}
                onCheckedChange={(checked) => handleToggleManager(m.id, !!checked)}
              />
              <Label htmlFor={`sst-${m.id}`} className="font-normal cursor-pointer">
                {m.name}
              </Label>
            </div>
          ))}
          {managers.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma gestora SST cadastrada.</p>
          )}
        </div>
      )}
    </div>
  );
};
