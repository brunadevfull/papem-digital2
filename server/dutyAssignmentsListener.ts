import { Client } from 'pg';

type DutyAssignmentPayload = {
  id?: number;
  [key: string]: unknown;
} | null;

type NotificationHandler = (payload: DutyAssignmentPayload) => Promise<void> | void;

const CHANNEL_NAME = 'duty_assignments_changed';
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
        console.error('❌ Falha ao reconectar LISTEN duty_assignments_changed:', error);
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

      let payload: DutyAssignmentPayload = null;
      if (msg.payload) {
        try {
          payload = JSON.parse(msg.payload);
        } catch (error) {
          console.error('❌ Falha ao analisar payload de NOTIFY duty_assignments_changed:', error);
        }
      }

      try {
        await handler(payload);
      } catch (error) {
        console.error('❌ Erro ao processar notificação de duty_assignments_changed:', error);
      }
    });

    client.on('error', (error) => {
      if (shuttingDown) {
        return;
      }

      console.error('❌ Conexão LISTEN duty_assignments_changed caiu:', error);
      cleanupListener().finally(scheduleReconnect);
    });

    client.on('end', () => {
      if (shuttingDown) {
        return;
      }

      console.warn('⚠️ Conexão LISTEN duty_assignments_changed encerrada. Tentando reconectar...');
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

export async function startDutyAssignmentsListener(handler: NotificationHandler): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL não configurada. Listener de duty_assignments não será iniciado.');
    return;
  }

  currentHandler = handler;
  shuttingDown = false;

  try {
    await connect(handler);
  } catch (error) {
    console.error('❌ Não foi possível iniciar listener duty_assignments:', error);
    scheduleReconnect();
  }
}

export async function stopDutyAssignmentsListener(): Promise<void> {
  shuttingDown = true;
  await cleanupListener();
}
