import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { WebglAddon } from 'xterm-addon-webgl';
import config from '../../config';
import 'xterm/css/xterm.css';

const TerminalModal = ({ device }) => {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1b1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#d19a66',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#ffffff',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    try {
      const webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
    } catch (err) {
      console.warn('WebGL não disponível:', err);
    }

    term.open(terminalRef.current);
    fitAddon.fit();

    // Conectar ao WebSocket
    const token = localStorage.getItem('token');
    const ws = new WebSocket(
      `${config.api.wsUrl}/terminal?deviceId=${device.id}&token=${token}`
    );

    ws.onopen = () => {
      term.writeln('Conectado ao dispositivo...');
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onerror = (error) => {
      term.writeln('\r\nErro na conexão WebSocket');
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      term.writeln('\r\nConexão encerrada');
    };

    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Resize handling
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    
    terminalInstance.current = term;
    wsRef.current = ws;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [device.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-black w-full h-full max-w-6xl max-h-[80vh] rounded-lg p-4 relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => window.location.reload()}
          >
            Reconectar
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.close()}
          >
            Fechar
          </button>
        </div>
        <div className="w-full h-full" ref={terminalRef} />
      </div>
    </div>
  );
};

export default TerminalModal;
