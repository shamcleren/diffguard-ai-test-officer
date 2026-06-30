import { createServer, type IncomingMessage } from 'node:http';

interface JournalEntry {
  request: {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    body: string;
  };
}

const port = Number(process.env.PAYMENT_MOCK_PORT ?? 8089);
const requests: JournalEntry[] = [];

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';

  if (req.method === 'GET' && url === '/health') {
    return json(res, 200, { ok: true, service: 'payment-mock' });
  }

  if (req.method === 'POST' && url === '/payments/authorize') {
    const body = await readBody(req);
    requests.push({
      request: {
        method: req.method,
        url,
        headers: req.headers,
        body,
      },
    });

    return json(res, 200, {
      paymentId: 'mock-pay-001',
      status: 'AUTHORIZED',
    });
  }

  if (req.method === 'GET' && url === '/__admin/requests') {
    return json(res, 200, { requests });
  }

  if (req.method === 'DELETE' && url === '/__admin/requests') {
    requests.length = 0;
    return json(res, 200, { deleted: true });
  }

  return json(res, 404, { error: `No mock mapping for ${req.method} ${url}` });
});

server.listen(port, () => {
  console.log(`payment mock listening on http://localhost:${port}`);
});

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: Parameters<Parameters<typeof createServer>[0]>[1], statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}
