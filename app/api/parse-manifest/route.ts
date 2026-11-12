import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

function parseTextLinesFallback(textContent: string): Array<Record<string, unknown>> {
  if (!textContent || !textContent.trim()) return [];

  const lines = textContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[-=_,.]{3,}$/.test(l));

  if (lines.length === 0) return [];

  const rows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip table header repeats or total lines
    if (/^(s\/?n|total|grand total|subtotal|page\s+\d)/i.test(line)) {
      continue;
    }

    // Determine separator: tab, comma, semicolon, pipe
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(';') && line.split(';').length >= 2) {
      parts = line.split(';');
    } else if (line.includes(',')) {
      // Split by comma, respecting quotes
      parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    } else {
      parts = [line];
    }

    parts = parts.map((p) => p.replace(/^"|"$/g, '').trim()).filter((p) => p !== '');
    if (parts.length === 0) continue;

    // Check if parts look like a header
    const joined = parts.join(' ').toLowerCase();
    if (
      /name|customer|cbm|amount|paid|credit|receiver|consignee/i.test(joined) &&
      i === 0
    ) {
      continue;
    }

    let name = '';
    let phone = '';
    let cbm = 0;
    let amount = 0;
    let paid = 0;
    let credit = 0;
    let containerName = '';
    let warehouse = '';
    let receiverName = '';
    let taken = 'Not Taken';

    // Parse columns by characteristics
    const remainingText: string[] = [];

    parts.forEach((p) => {
      // Clean numbers
      const numClean = p.replace(/[^0-9.-]/g, '');
      const numVal = parseFloat(numClean);

      // Check phone number (starts with +, 0, or has 8-15 digits)
      if (
        !phone &&
        /^[+]?[\d\s-]{8,18}$/.test(p) &&
        /\d{4,}/.test(p)
      ) {
        phone = p;
        return;
      }

      // Check container
      if (!containerName && /^(container|cont|cnt)\s*[\w-]+/i.test(p)) {
        containerName = p;
        return;
      }

      // Check status
      if (/taken|collected|partial|pending/i.test(p)) {
        taken = p;
        return;
      }

      // Check number
      if (!Number.isNaN(numVal) && numClean.length > 0) {
        if (!cbm && numVal > 0 && numVal <= 150 && (p.includes('.') || numVal < 50)) {
          cbm = numVal;
          return;
        }
        if (!amount && numVal > 0) {
          amount = numVal;
          return;
        }
        if (!paid && amount > 0 && numVal <= amount) {
          paid = numVal;
          return;
        }
      }

      // Text string
      remainingText.push(p);
    });

    if (remainingText.length > 0) {
      name = remainingText[0];
      if (remainingText.length > 1 && !receiverName) {
        receiverName = remainingText[1];
      }
      if (remainingText.length > 2 && !warehouse) {
        warehouse = remainingText[2];
      }
    }

    if (!name) {
      name = `Customer ${rows.length + 1}`;
    }

    credit = Math.max(0, amount - paid);

    rows.push({
      containerName,
      name,
      phone,
      cbm,
      amount,
      takenStatus: taken.toLowerCase().includes('partial')
        ? 'Partial'
        : taken.toLowerCase().includes('taken') || taken.toLowerCase().includes('collect')
        ? 'Taken'
        : 'Not Taken',
      taken,
      paid,
      credit,
      receiverName,
      receiverPhone: '',
      receiverDate: '',
      warehouse,
    });
  }

  return rows;
}

const manifestResponseSchema = {
  type: Type.OBJECT,
  properties: {
    detectedContainerName: {
      type: Type.STRING,
      description: 'Container name or number detected from the manifest header or rows, if any.',
    },
    detectedWarehouse: {
      type: Type.STRING,
      description: 'Warehouse name or location detected from the manifest, if any.',
    },
    rows: {
      type: Type.ARRAY,
      description: 'List of customer cargo entries extracted from the manifest.',
      items: {
        type: Type.OBJECT,
        properties: {
          containerName: {
            type: Type.STRING,
            description: 'Container name or number for this row (if specified).',
          },
          name: {
            type: Type.STRING,
            description: 'Customer or cargo owner name, or item/goods description.',
          },
          phone: {
            type: Type.STRING,
            description: 'Customer phone number if available.',
          },
          cbm: {
            type: Type.NUMBER,
            description: 'CBM (Cubic meters volume) as a number if available.',
          },
          amount: {
            type: Type.NUMBER,
            description: 'Total financial amount/charge as a number if available.',
          },
          takenStatus: {
            type: Type.STRING,
            description: 'Status of collection: "Not Taken", "Partial", or "Taken".',
          },
          taken: {
            type: Type.STRING,
            description: 'Taken description or quantity collected (default "Not Taken").',
          },
          paid: {
            type: Type.NUMBER,
            description: 'Amount paid so far as a number.',
          },
          credit: {
            type: Type.NUMBER,
            description: 'Credit or balance owed as a number.',
          },
          receiverName: {
            type: Type.STRING,
            description: "Receiver's name if collected.",
          },
          receiverPhone: {
            type: Type.STRING,
            description: "Receiver's phone number if available.",
          },
          receiverDate: {
            type: Type.STRING,
            description: "Receiver's collection date in YYYY-MM-DD format if available.",
          },
          warehouse: {
            type: Type.STRING,
            description: 'Warehouse name or location if specified.',
          },
        },
      },
    },
  },
  required: ['rows'],
};

const warehouseResponseSchema = {
  type: Type.OBJECT,
  properties: {
    rows: {
      type: Type.ARRAY,
      description: 'List of warehouse inventory records extracted from the uploaded sheet.',
      items: {
        type: Type.OBJECT,
        properties: {
          goodsInStock: {
            type: Type.STRING,
            description: 'Goods in-stock (description and quantity currently in stock).',
          },
          goodsArrivalDate: {
            type: Type.STRING,
            description: 'Goods arrival date in YYYY-MM-DD format.',
          },
          containerName: {
            type: Type.STRING,
            description: 'Container name or number the goods were taken out of.',
          },
          takeoutFromContainer: {
            type: Type.STRING,
            description: 'Takeout from container (goods offloaded/taken out of that container).',
          },
          takeoutFromWarehouse: {
            type: Type.STRING,
            description: 'Takeout from warehouse (goods dispatched/removed from warehouse).',
          },
          warehouseName: {
            type: Type.STRING,
            description: 'Name of warehouse.',
          },
          offloaderName: {
            type: Type.STRING,
            description: 'Name of container offloader.',
          },
          personName: {
            type: Type.STRING,
            description: 'Name of person (staff recording or responsible).',
          },
          confirmationStatus: {
            type: Type.STRING,
            description: 'Confirmation status: "Confirmed" or "Pending".',
          },
          goodsCondition: {
            type: Type.STRING,
            description: 'Goods condition: "Good", "Damaged", or "Part Damaged".',
          },
          conditionDetails: {
            type: Type.STRING,
            description: 'Details about good or damaged condition.',
          },
          unaccountedDetails: {
            type: Type.STRING,
            description: 'Unaccounted / missing goods in that container.',
          },
          credit: {
            type: Type.NUMBER,
            description: 'Credit amount for that container as a clean number.',
          },
        },
      },
    },
  },
  required: ['rows'],
};

export async function POST(req: NextRequest) {
  let body: {
    textContent?: string;
    fileBase64?: string;
    mimeType?: string;
    mode?: 'customer' | 'warehouse';
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ rows: [] });
  }

  const { textContent, fileBase64, mimeType, mode } = body;
  const isWarehouse = mode === 'warehouse';

  const apiKey = process.env.GEMINI_API_KEY || '';
  const hasValidApiKey =
    apiKey.trim().length > 5 && apiKey !== 'MY_GEMINI_API_KEY';

  // If Gemini API is available, attempt AI extraction
  if (hasValidApiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = isWarehouse
        ? `You are a warehouse inventory extraction assistant for Deep Down Logistics.
Extract all warehouse inventory rows into fields:
goodsInStock, goodsArrivalDate (YYYY-MM-DD), containerName, takeoutFromContainer, takeoutFromWarehouse, warehouseName, offloaderName, personName, confirmationStatus ("Confirmed"|"Pending"), goodsCondition ("Good"|"Damaged"|"Part Damaged"), conditionDetails, unaccountedDetails, credit.
Even if some fields are missing or not present in the document, extract every row and leave missing fields as empty strings or 0. Return structured JSON.`
        : `You are a logistics manifest extraction assistant for Deep Down Logistics.
Extract all cargo rows from the provided manifest into:
containerName, name (Customer or item/goods description), phone, cbm (number), amount (number), takenStatus ("Not Taken"|"Partial"|"Taken"), taken, paid (number), credit (number, or amount - paid), receiverName, receiverPhone, receiverDate, warehouse.
IMPORTANT: Some info might not be in the manifest. Extract every row with whatever information is available. If customer name is missing, use the goods/cargo description or label as "Customer 1", "Customer 2". Leave any missing info as empty strings or 0 so staff can fill them in later. Return structured JSON.`;

      const contents: Array<
        | string
        | { inlineData: { data: string; mimeType: string } }
      > = [];

      if (fileBase64 && mimeType) {
        contents.push({
          inlineData: {
            data: fileBase64,
            mimeType,
          },
        });
      }

      if (textContent) {
        contents.push(
          `Extract all rows from this manifest data:\n\n${textContent}`
        );
      } else {
        contents.push(
          `Extract all cargo records from this uploaded document.`
        );
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: isWarehouse
            ? warehouseResponseSchema
            : manifestResponseSchema,
        },
      });

      const rawText = response.text || '{"rows":[]}';
      const parsed = JSON.parse(rawText);
      const rows = Array.isArray(parsed.rows) ? parsed.rows : [];

      if (rows.length > 0) {
        return NextResponse.json(parsed);
      }
    } catch (aiErr) {
      console.warn('Gemini manifest extraction encountered error, using local fallback:', aiErr);
    }
  }

  // Graceful fallback for text/csv content (always succeeds with 200 OK)
  if (textContent && textContent.trim()) {
    const fallbackRows = parseTextLinesFallback(textContent);
    return NextResponse.json({
      rows: fallbackRows,
      detectedContainerName: '',
      detectedWarehouse: '',
    });
  }

  return NextResponse.json({ rows: [] });
}
