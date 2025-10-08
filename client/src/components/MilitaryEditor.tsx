import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { MilitaryPersonnel } from '../../../shared/schema';

interface MilitaryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  military: MilitaryPersonnel | null;
  onSave: (updatedMilitary: Partial<MilitaryPersonnel>) => Promise<void>;
}

const RANKS = {
  officer: [
    { value: 'cmg', label: 'CMG - Capitão de Mar e Guerra' },
    { value: 'cf', label: 'CF - Capitão de Fragata' },
    { value: 'cc', label: 'CC - Capitão de Corveta' },
    { value: 'ct', label: 'CT - Capitão-Tenente' },
    { value: '1t', label: '1T - Primeiro-Tenente' },
    { value: '2t', label: '2T - Segundo-Tenente' }
  ],
  master: [
    { value: '1sg', label: '1SG - Primeiro-Sargento' },
    { value: '2sg', label: '2SG - Segundo-Sargento' },
    { value: '3sg', label: '3SG - Terceiro-Sargento' }
  ]
};

const SPECIALTIES = [
  { value: 'IM', label: 'IM - Intendência da Marinha' },
  { value: 'T', label: 'T - Transmissões' },
  { value: 'QC-IM', label: 'QC-IM - Quadro Complementar Intendência' },
  { value: 'RM2-T', label: 'RM2-T - Reserva Mobilizável Transmissões' },
  { value: 'AA', label: 'AA - Administração' },
  { value: 'PD', label: 'PD - Praticagem' },
  { value: 'CL', label: 'CL - Comunicações' },
  { value: 'ES', label: 'ES - Eletrônica' },
  { value: 'EP', label: 'EP - Engenharia' },
  { value: 'PL', label: 'PL - Pilotagem' },
  { value: 'QI', label: 'QI - Química Industrial' }
];

export function MilitaryEditor({ isOpen, onClose, military, onSave }: MilitaryEditorProps) {
  const [formData, setFormData] = useState({
    name: military?.name || '',
    rank: military?.rank || '',
    specialty: military?.specialty || 'none',
    type: military?.type || 'officer' as 'officer' | 'master'
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (military) {
      setFormData({
        name: military.name,
        rank: military.rank,
        specialty: military.specialty || 'none',
        type: military.type
      });
    }
  }, [military]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.rank) return;
    
    setLoading(true);
    try {
      const rankData = RANKS[formData.type].find(r => r.value === formData.rank);
      
      await onSave({
        name: formData.name.trim().toUpperCase(),
        rank: formData.rank as any,
        specialty: formData.specialty === 'none' ? null : formData.specialty || null,
        type: formData.type,
        fullRankName: rankData?.label.split(' - ')[1] || formData.rank
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar militar:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentRankData = RANKS[formData.type].find(r => r.value === formData.rank);
  const currentSpecialtyData = SPECIALTIES.find(s => s.value === formData.specialty);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {military ? 'Editar Militar' : 'Novo Militar'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <Label>Tipo</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'officer' | 'master') => {
                setFormData({ ...formData, type: value, rank: '', specialty: '' });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="officer">Oficial</SelectItem>
                <SelectItem value="master">Praça</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nome */}
          <div>
            <Label>Nome</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: JOÃO SILVA"
            />
          </div>

          {/* Graduação */}
          <div>
            <Label>Graduação</Label>
            <Select 
              value={formData.rank} 
              onValueChange={(value) => setFormData({ ...formData, rank: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a graduação" />
              </SelectTrigger>
              <SelectContent>
                {RANKS[formData.type].map((rank) => (
                  <SelectItem key={rank.value} value={rank.value}>
                    {rank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Especialidade */}
          <div>
            <Label>Especialidade (Opcional)</Label>
            <Select 
              value={formData.specialty} 
              onValueChange={(value) => setFormData({ ...formData, specialty: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem especialidade</SelectItem>
                {SPECIALTIES.map((spec) => (
                  <SelectItem key={spec.value} value={spec.value}>
                    {spec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {formData.name && formData.rank && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {formData.rank.toUpperCase()}
                  {formData.specialty && ` (${formData.specialty.toUpperCase()})`}
                  {' '}
                  {formData.name.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim() || !formData.rank || loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}