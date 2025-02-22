import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Terminal } from 'lucide-react';
import TerminalModal from './TerminalModal';
import config from '../../config';

const DeviceConnectModal = ({ open, onClose, device }) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      // Verificar se o dispositivo está online
      const response = await fetch(`${config.api.baseUrl}/api/devices/${device.id}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar status do dispositivo');
      }

      const { status } = await response.json();
      
      if (status === 'offline') {
        throw new Error('Dispositivo está offline');
      }

      // Se estiver online, mostrar o terminal
      setShowTerminal(true);
      onClose(); // Fecha o modal de conexão

    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar ao Dispositivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">Detalhes da Conexão</h3>
              <p>Dispositivo: {device?.name}</p>
              <p>IP: {device?.ip}</p>
              <p>Porta: {device?.port}</p>
              <p>Fabricante: {device?.manufacturer}</p>
            </div>

            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} disabled={connecting}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConnect} 
                disabled={connecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Terminal className="w-4 h-4 mr-2" />
                {connecting ? 'Conectando...' : 'Conectar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showTerminal && (
        <TerminalModal
          open={showTerminal}
          onClose={() => setShowTerminal(false)}
          device={device}
        />
      )}
    </>
  );
};

export default DeviceConnectModal;
