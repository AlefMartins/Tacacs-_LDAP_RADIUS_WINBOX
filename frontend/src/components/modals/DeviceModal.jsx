import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import config from '@/config';

const manufacturers = [
  { id: 'datacom', name: 'Datacom OLT/Switch' },
  { id: 'cisco', name: 'Cisco Router/Switch' },
  { id: 'huawei', name: 'Huawei NE8000' },
  { id: 'zte', name: 'ZTE OLT C300/C600' },
  { id: 'furukawa', name: 'Furukawa OLT G2500' }
];

console.log('Config:', config);

const getAccessGroups = () => {
  console.log('AD Config:', config.ad); // Debug
  const groups = [
    ...(config.ad?.adminGroups || []).map(group => ({
      id: group,
      name: `Nível 15 - ${group}`,
      level: 15,
      color: 'text-blue-600'
    })),
    ...(config.ad?.nocGroups || []).map(group => ({
      id: group,
      name: `Nível 10 - ${group}`,
      level: 10,
      color: 'text-green-600'
    })),
    ...(config.ad?.monitorGroups || []).map(group => ({
      id: group,
      name: `Nível 5 - ${group}`,
      level: 5,
      color: 'text-amber-600'
    }))
  ];
  console.log('Generated Groups:', groups); // Debug
  return groups;
};

const DeviceModal = ({ open, onClose, onSubmit, editDevice = null }) => {
  const [device, setDevice] = useState({
    name: '',
    ip: '',
    port: '22',
    manufacturer: '',
    groups: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const accessGroups = getAccessGroups();
  
  useEffect(() => {
    if (editDevice) {
      setDevice(editDevice);
    } else {
      setDevice({
        name: '',
        ip: '',
        port: '22',
        manufacturer: '',
        groups: []
      });
    }
  }, [editDevice, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações
      if (!device.name || !device.ip || !device.manufacturer || device.groups.length === 0) {
        throw new Error('Todos os campos são obrigatórios, incluindo pelo menos um grupo de acesso');
      }

      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(device.ip)) {
        throw new Error('IP inválido');
      }

      const port = parseInt(device.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('Porta inválida');
      }

      await onSubmit(device);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId) => {
    setDevice(prev => {
      const newGroups = prev.groups.includes(groupId)
        ? prev.groups.filter(g => g !== groupId)
        : [...prev.groups, groupId];
      return { ...prev, groups: newGroups };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editDevice ? 'Editar Dispositivo' : 'Adicionar Novo Dispositivo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome do Dispositivo</label>
            <Input
              value={device.name}
              onChange={(e) => setDevice({ ...device, name: e.target.value })}
              placeholder="Ex: OLT-DC-01"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Endereço IP</label>
            <Input
              value={device.ip}
              onChange={(e) => setDevice({ ...device, ip: e.target.value })}
              placeholder="Ex: 192.168.1.1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Porta SSH</label>
            <Input
              type="number"
              value={device.port}
              onChange={(e) => setDevice({ ...device, port: e.target.value })}
              placeholder="22"
              required
              min="1"
              max="65535"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fabricante</label>
            <Select
              value={device.manufacturer}
              onValueChange={(value) => setDevice({ ...device, manufacturer: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fabricante">
                  {device.manufacturer ? 
                    manufacturers.find(m => m.id === device.manufacturer)?.name :
                    'Selecione o fabricante'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(manufacturer => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Grupos de Acesso</label>
            <div className="border rounded-md p-3 space-y-2 mt-1">
              {accessGroups.map(group => (
                <label 
                  key={group.id} 
                  className={`flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 ${group.color}`}
                >
                  <input
                    type="checkbox"
                    checked={device.groups.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    className="rounded border-gray-300"
                  />
                  <span>{group.name}</span>
                </label>
              ))}
            </div>
            {device.groups.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Selecione pelo menos um grupo</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || device.groups.length === 0}
            >
              {loading ? 
                (editDevice ? 'Salvando...' : 'Adicionando...') : 
                (editDevice ? 'Salvar' : 'Adicionar')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceModal;