import { createServer, Server, Socket } from 'net';
import { parseCdrLine, saveCdrRecord } from '../services/cdr-parser';

let cdrServer: Server | null = null;

export function startCdrServer(port: number): void {
  cdrServer = createServer((socket: Socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`CDR client connected: ${clientAddress}`);

    socket.on('data', async (data: Buffer) => {
      const lines = data.toString('utf8').trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          await processCdrLine(line.trim());
        }
      }
    });

    socket.on('close', () => {
      console.log(`CDR client disconnected: ${clientAddress}`);
    });

    socket.on('error', (error: Error) => {
      console.error(`CDR socket error from ${clientAddress}:`, error);
    });

    // Send acknowledgment to client
    socket.write('OK\n');
  });

  cdrServer.on('error', (error: Error) => {
    console.error('CDR server error:', error);
  });

  // Listen on all interfaces (0.0.0.0) to accept connections from network
  cdrServer.listen(port, '0.0.0.0', () => {
    console.log(`📞 CDR server listening on 0.0.0.0:${port}`);
  });
}

export function stopCdrServer(): void {
  if (cdrServer) {
    cdrServer.close(() => {
      console.log('CDR server stopped');
    });
    cdrServer = null;
  }
}

async function processCdrLine(line: string): Promise<void> {
  try {
    console.log('Processing CDR line:', line.substring(0, 100) + (line.length > 100 ? '...' : ''));
    
    const parsedCdr = parseCdrLine(line);
    if (!parsedCdr) {
      console.warn('Failed to parse CDR line');
      return;
    }

    const saved = await saveCdrRecord(parsedCdr);
    if (saved) {
      console.log('✅ CDR record processed successfully');
    }
  } catch (error) {
    console.error('Error processing CDR line:', error);
  }
}
