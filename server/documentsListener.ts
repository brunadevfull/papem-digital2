import { Client } from 'pg';

type DocumentPayload = {
  id?: number;
  [key: string]: unknown;
} | null;

type NotificationHandler = (payload: DocumentPayload) => Promise<void> | void;

const CHANNEL_NAME = 'documents_changed';
const RECONNECT_DELAY_MS = 5000;

let listenerClient: Client | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentHandler: NotificationHandler | null = null;
let shuttingDown = false;

function scheduleReconnect() {
  if (shuttingDown || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (currentHandler) {
      connect(currentHandler).catch((error) => {
        console.error('❌ Falha ao reconectar LISTEN documents_changed:', error);
        scheduleReconnect();
      });
    }
  }, RECONNECT_DELAY_MS);
}

async function connect(handler: NotificationHandler): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está configurada. Não é possível iniciar listener.');
  }

  if (listenerClient) {
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL_NAME}`);
    listenerClient = client;

    console.log(`📡 Listener PostgreSQL iniciado. Aguardando notificações em "${CHANNEL_NAME}".`);

    client.on('notification', async (msg) => {
      if (msg.channel !== CHANNEL_NAME) {
        return;
      }

      let payload: DocumentPayload = null;
      if (msg.payload) {
        try {
          payload = JSON.parse(msg.payload);
        } catch (error) {
          console.error('❌ Falha ao analisar payload de NOTIFY documents_changed:', error);
        }
      }

      try {
        await handler(payload);
      } catch (error) {
        console.error('❌ Erro ao processar notificação de documents_changed:', error);
      }
    });

    client.on('error', (error) => {
      if (shuttingDown) {
        return;
      }

      console.error('❌ Conexão LISTEN documents_changed caiu:', error);
      cleanupListener().finally(scheduleReconnect);
    });

    client.on('end', () => {
      if (shuttingDown) {
        return;
      }

      console.warn('⚠️ Conexão LISTEN documents_changed encerrada. Tentando reconectar...');
      cleanupListener().finally(scheduleReconnect);
    });
  } catch (error) {
    await cleanupListener();
    throw error;
  }
}

async function cleanupListener(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (listenerClient) {
    const client = listenerClient;
    listenerClient = null;

    client.removeAllListeners('notification');
    client.removeAllListeners('error');
    client.removeAllListeners('end');

    try {
      await client.query(`UNLISTEN ${CHANNEL_NAME}`);
    } catch {
      // Ignore errors while unlistening
    }

    try {
      await client.end();
    } catch {
      // Ignore errors while closing connection
    }
  }
}

export async function startDocumentsListener(handler: NotificationHandler): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL não configurada. Listener de documents não será iniciado.');
    return;
  }

  currentHandler = handler;
  shuttingDown = false;

  try {
    await connect(handler);
  } catch (error) {
    console.error('❌ Não foi possível iniciar listener documents:', error);
    scheduleReconnect();
  }
}

export async function stopDocumentsListener(): Promise<void> {
  shuttingDown = true;
  await cleanupListener();
}
