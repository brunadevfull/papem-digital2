import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { InsertDocument, PDFDocument } from '@shared/schema';
import type { Server } from 'http';

type StorageModule = typeof import('../storage');

const decoder = new TextDecoder();

let storageModule: StorageModule;
let server: Server;
let baseUrl: string;
let originalDatabaseUrl = process.env.DATABASE_URL;

let documentsStore: PDFDocument[] = [];
let nextDocumentId = 1;

function buildDocument(insert: InsertDocument): PDFDocument {
  return {
    id: nextDocumentId++,
    title: insert.title,
    url: insert.url,
    type: insert.type,
    category: insert.category ?? null,
    unit: insert.unit ?? undefined,
    active: insert.active ?? true,
    tags: insert.tags ?? [],
    uploadDate: insert.uploadDate instanceof Date ? insert.uploadDate : new Date(),
  };
}

before(async () => {
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/test';
  storageModule = await import('../storage');

  const storageInstance = storageModule.storage as unknown as Record<string, unknown>;

  storageInstance.runMigrations = async () => {};
  storageInstance.getUserByUsername = async () => undefined;
  storageInstance.createUser = async (user: { username: string; password: string }) => ({
    id: 1,
    ...user,
  });
  storageInstance.getDocuments = async () => documentsStore.map(doc => ({ ...doc, tags: [...(doc.tags ?? [])] }));
  storageInstance.getDocument = async (id: number) => documentsStore.find(doc => doc.id === id);
  storageInstance.createDocument = async (insert: InsertDocument) => {
    const document = buildDocument(insert);
    documentsStore.push(document);
    return document;
  };
  storageInstance.updateDocument = async (document: PDFDocument) => {
    const index = documentsStore.findIndex(doc => doc.id === document.id);
    if (index === -1) {
      throw new Error('Document not found');
    }

    documentsStore[index] = {
      ...documentsStore[index],
      ...document,
      tags: document.tags ?? [],
    };

    return documentsStore[index];
  };
  storageInstance.deleteDocument = async (id: number) => {
    const initialLength = documentsStore.length;
    documentsStore = documentsStore.filter(doc => doc.id !== id);
    return documentsStore.length < initialLength;
  };
  storageInstance.getDutyOfficers = async () => null;
  storageInstance.updateDutyOfficers = async () => ({
    id: 1,
    officerName: '',
    masterName: '',
    validFrom: new Date(),
    updatedAt: new Date(),
  });
  storageInstance.getDocumentViewState = async () => undefined;
  storageInstance.getAllDocumentViewStates = async () => ({});
  storageInstance.setDocumentViewState = async () => true;

  delete process.env.DATABASE_URL;

  const routesModule = await import('../routes');

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  server = await routesModule.registerRoutes(app);

  await new Promise<void>(resolve => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
  documentsStore = [];
  nextDocumentId = 1;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (originalDatabaseUrl) {
    process.env.DATABASE_URL = originalDatabaseUrl;
  } else {
    delete process.env.DATABASE_URL;
  }
});

test('rejects documents with invalid type values', async () => {
  const response = await fetch(`${baseUrl}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Invalid Type Document',
      url: '/uploads/invalid.pdf',
      type: 'invalid-type-value',
      active: true,
    }),
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error, 'Invalid data');
});

test('normalizes cardapio type with unit suffix and exposes it via SSE snapshot', async () => {
  const createResponse = await fetch(`${baseUrl}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Cardápio do dia',
      url: '/uploads/cardapio.pdf',
      type: 'cardapio-EAGM',
      active: true,
    }),
  });

  assert.equal(createResponse.status, 200);
  const created = await createResponse.json();
  assert.equal(created.type, 'cardapio');
  assert.equal(created.unit, 'EAGM');

  const response = await fetch(`${baseUrl}/api/documents/stream`, {
    headers: { Accept: 'text/event-stream' },
  });

  assert.equal(response.status, 200);

  const reader = response.body?.getReader();
  assert.ok(reader, 'SSE response should provide a readable stream');

  let snapshot: any;
  let buffer = '';

  while (!snapshot) {
    const { value, done } = await reader.read();
    assert.ok(!done, 'SSE stream ended before receiving snapshot');

    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      if (rawEvent.startsWith(':') || rawEvent.trim() === '') {
        separatorIndex = buffer.indexOf('\n\n');
        continue;
      }

      const dataLine = rawEvent.split('\n').find(line => line.startsWith('data:'));
      if (dataLine) {
        const payload = JSON.parse(dataLine.slice(5).trim());
        if (payload.type === 'snapshot') {
          snapshot = payload;
          break;
        }
      }

      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  await reader.cancel();

  assert.ok(Array.isArray(snapshot.documents), 'Snapshot should include a documents array');
  const stored = snapshot.documents.find((doc: any) => doc.title === 'Cardápio do dia');
  assert.ok(stored, 'Snapshot should include the newly created document');
  assert.equal(stored.type, 'cardapio');
  assert.equal(stored.unit, 'EAGM');
});
