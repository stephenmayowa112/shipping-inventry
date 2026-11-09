import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
            description: '1. Container name or number for this row (if specified).',
          },
          name: {
            type: Type.STRING,
            description: '2. Customer or cargo owner name.',
          },
          phone: {
            type: Type.STRING,
            description: '3. Customer phone number.',
          },
          cbm: {
            type: Type.NUMBER,
            description: '4. CBM (Cubic meters volume) as a number.',
          },
          amount: {
            type: Type.NUMBER,
            description: '5. Total financial amount/charge as a number.',
          },
          takenStatus: {
            type: Type.STRING,
            description: '6a. Status of collection: must be one of "Not Taken", "Partial", or "Taken".',
          },
          taken: {
            type: Type.STRING,
            description: '6b. Taken description or quantity collected (e.g. "Not Taken", "All Collected", "10 of 20 Cartons").',
          },
          paid: {
            type: Type.NUMBER,
            description: '7. Amount paid so far as a number.',
          },
          credit: {
            type: Type.NUMBER,
            description: '8. Credit or balance owed (Amount minus Paid) as a number.',
          },
          receiverName: {
            type: Type.STRING,
            description: "9a. Receiver's name (person who collected the goods, if any).",
          },
          receiverPhone: {
            type: Type.STRING,
            description: "9b. Receiver's phone number (if any).",
          },
          receiverDate: {
            type: Type.STRING,
            description: "9c. Receiver's collection date in YYYY-MM-DD format (if any).",
          },
          warehouse: {
            type: Type.STRING,
            description: '10. Warehouse name or location (if specified).',
          },
        },
        required: ['name'],
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
            description: '1. Goods in-stock (description and quantity currently in stock).',
          },
          goodsArrivalDate: {
            type: Type.STRING,
            description: '2. Goods arrival date in YYYY-MM-DD format.',
          },
          containerName: {
            type: Type.STRING,
            description: '3a. Container name or number the goods were taken out of.',
          },
          takeoutFromContainer: {
            type: Type.STRING,
            description: '3b. Takeout from container (goods offloaded/taken out of that container).',
          },
          takeoutFromWarehouse: {
            type: Type.STRING,
            description: '4. Takeout from warehouse (goods dispatched/removed from warehouse).',
          },
          warehouseName: {
            type: Type.STRING,
            description: '5a. Name of warehouse.',
          },
          offloaderName: {
            type: Type.STRING,
            description: '5b. Name of container offloader (person who offloaded the container).',
          },
          personName: {
            type: Type.STRING,
            description: '6. Name of person (staff recording or responsible).',
          },
          confirmationStatus: {
            type: Type.STRING,
            description: '7. Confirmation status: "Confirmed" or "Pending".',
          },
          goodsCondition: {
            type: Type.STRING,
            description: '8a. Goods condition: "Good", "Damaged", or "Part Damaged".',
          },
          conditionDetails: {
            type: Type.STRING,
            description: '8b. Details about good or damaged condition.',
          },
          unaccountedDetails: {
            type: Type.STRING,
            description: '9. Unaccounted / missing goods in that container (or "None (0 Missing)").',
          },
          credit: {
            type: Type.NUMBER,
            description: '10. Credit amount for that container as a clean number.',
          },
        },
        required: ['goodsInStock'],
      },
    },
  },
  required: ['rows'],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { textContent, fileBase64, mimeType, mode } = body as {
      textContent?: string;
      fileBase64?: string;
      mimeType?: string;
      mode?: 'customer' | 'warehouse';
    };

    const isWarehouse = mode === 'warehouse';

    const systemInstruction = isWarehouse
      ? `You are a warehouse inventory extraction assistant for Deep Down Logistics.
Extract all warehouse inventory rows into the 10 standard warehouse fields:
1. Goods in-stock (goodsInStock)
2. Goods arrival date (goodsArrivalDate in YYYY-MM-DD)
3. Takeout from container (containerName and takeoutFromContainer)
4. Takeout from warehouse (takeoutFromWarehouse)
5. Name of warehouse / container offloader (warehouseName and offloaderName)
6. Name of person (personName)
7. Confirmation (confirmationStatus: "Confirmed" | "Pending")
8. Goods condition (goodsCondition: "Good" | "Damaged" | "Part Damaged", and conditionDetails)
9. Unaccounted / missing goods (unaccountedDetails, default to "None (0 Missing)" if none)
10. Credit (credit as a clean number without currency symbols or commas)
Ignore empty rows or grand totals. Return clean JSON.`
      : `You are a logistics manifest extraction assistant for Deep Down Logistics.
Extract all customer cargo rows from the provided manifest into the 10 standard fields:
1. Container (containerName)
2. Name (Customer / Cargo Owner Name)
3. Phone Number (phone)
4. CBM (cbm - numeric volume)
5. Amount (amount - total charge/cost as a clean number without currency symbols or commas)
6. Taken (takenStatus: "Not Taken" | "Partial" | "Taken", and taken: description/quantity collected, default to "Not Taken" if not specified)
7. Paid (paid - amount paid as a clean number, default to 0 if not specified)
8. Credit (credit - balance owed, calculated as amount - paid if not explicitly given)
9. Receiver's Details (receiverName, receiverPhone, receiverDate)
10. Warehouse (warehouse location if mentioned)

Ignore empty rows, subtotals, or grand total summary rows. Return clean structured JSON.`;

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
        `Extract all ${isWarehouse ? 'warehouse inventory' : 'manifest customer cargo'} records from the following data:\n\n${textContent}`
      );
    } else {
      contents.push(
        `Extract all ${isWarehouse ? 'warehouse inventory' : 'manifest customer cargo'} records from this uploaded document.`
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
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to parse uploaded file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
