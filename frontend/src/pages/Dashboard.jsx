import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Lock, Terminal, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import DeviceModal from '@/components/modals/DeviceModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import DeviceConnectModal from '@/components/modals/DeviceConnectModal';
import { checkTokenExpiration } from '@/utils/auth';
import config from '@/config';

const logoImg = '/images/logo.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deviceToEdit, setDeviceToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!checkTokenExpiration()) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchDevices();
  }, [navigate]);

  useEffect(() => {
    // Atualizar status dos dispositivos a cada 30 segundos
    const statusInterval = setInterval(() => {
      if (devices.length > 0) {
        devices.forEach(device => checkDeviceStatus(device.id));
      }
    }, 30000);

    return () => clearInterval(statusInterval);
  }, [devices]);

  const fetchDevices = async () => {
    try {
      if (!checkTokenExpiration()) {
        navigate('/login');
        return;
      }

      console.log('Iniciando busca de dispositivos');
      const response = await fetch(`${config.api.baseUrl}/api/devices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao carregar dispositivos');
      }

      const data = await response.json();
      setDevices(data);
    } catch (err) {
      console.error('Erro ao buscar dispositivos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSubmit = async (deviceData) => {
    try {
      if (!checkTokenExpiration()) {
        navigate('/login');
        return;
      }

      const url = deviceData.id 
        ? `${config.api.baseUrl}/api/devices/${deviceData.id}`
        : `${config.api.baseUrl}/api/devices`;

      const method = deviceData.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(deviceData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Erro ao ${deviceData.id ? 'editar' : 'adicionar'} dispositivo`);
      }

      fetchDevices();
      setShowDeviceModal(false);
      setDeviceToEdit(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    try {
      if (!checkTokenExpiration()) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.api.baseUrl}/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir dispositivo');
      }

      fetchDevices();
      setDeviceToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const checkDeviceStatus = async (deviceId) => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/devices/${deviceId}/check-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchDevices();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEditClick = (device) => {
    setDeviceToEdit(device);
    setShowDeviceModal(true);
  };

  const StatusIndicator = ({ status }) => (
    <div 
      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
        status === 'online' ? 'bg-green-500' : 
        status === 'offline' ? 'bg-red-500' : 
        'bg-yellow-500'
      }`}
      title={
        status === 'online' ? 'Online' : 
        status === 'offline' ? 'Offline' : 
        'Status desconhecido'
      }
    />
  );

  const canManageDevices = user?.accessLevel >= 15;
  const canViewDetails = user?.accessLevel >= 10;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={logoImg} alt="Logo" className="h-8" />
            <h1 className="text-xl font-bold">TACACS+ Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setShowChangePasswordModal(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Dispositivos</h2>
            <p className="text-gray-600">
              Usuário: {user?.username} (Nível {user?.accessLevel})
            </p>
          </div>
          {canManageDevices && (
            <Button onClick={() => setShowDeviceModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Dispositivo
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map(device => (
              <Card key={device.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{device.name}</h3>
                    {canViewDetails && (
                      <p className="text-sm text-gray-500">IP: {device.ip}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={device.status} />
                    {canManageDevices && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(device)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeviceToDelete(device)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {canViewDetails && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">Fabricante: {device.manufacturer}</p>
                      <p className="text-sm">Porta: {device.port}</p>
                    </div>
                  )}
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedDevice(device)}
                  >
                    <Terminal className="w-4 h-4 mr-2" />
                    Conectar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <DeviceModal 
        open={showDeviceModal} 
        onClose={() => {
          setShowDeviceModal(false);
          setDeviceToEdit(null);
        }}
        onSubmit={handleDeviceSubmit}  // Aqui deve estar definido
        editDevice={deviceToEdit}
      />
            
      <ChangePasswordModal 
        open={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
      
      {selectedDevice && (
        <DeviceConnectModal
          open={!!selectedDevice}
          onClose={() => setSelectedDevice(null)}
          device={selectedDevice}
        />
      )}

      <AlertDialog open={!!deviceToDelete} onOpenChange={() => setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o dispositivo "{deviceToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteDevice(deviceToDelete.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;