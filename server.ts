import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer & Cultura',
  'Saúde & Cuidados',
  'Educação',
  'Serviços & Contas',
  'Outros',
] as const;

const ALLOWED_ACCOUNTS = [
  'Cartão de Crédito',
  'Conta Corrente',
  'Pix',
  'Dinheiro',
  'Boleto',
] as const;

interface ScanRequestBody {
  imageBase64?: string;
  mimeType?: string;
  todayDate?: string;
}

interface ParsedReceiptResponse {
  isValidDocument: boolean;
  documentType: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  account: string;
  status: 'paid' | 'pending';
  notes: string;
  confidence: 'alta' | 'media' | 'baixa';
  rejectionReason?: string;
}

function normalizeCategory(category: string): string {
  const match = ALLOWED_CATEGORIES.find(
    (c) => c.toLowerCase() === (category || '').trim().toLowerCase()
  );
  return match || 'Outros';
}

function normalizeAccount(account: string): string {
  const match = ALLOWED_ACCOUNTS.find(
    (a) => a.toLowerCase() === (account || '').trim().toLowerCase()
  );
  return match || 'Conta Corrente';
}

function normalizeDate(dateStr: string, fallback: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return fallback;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  app.post('/api/receipts/scan', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error:
            'Chave da API Gemini não encontrada. Configure GEMINI_API_KEY no painel Settings > Secrets.',
        });
      }

      const { imageBase64, mimeType, todayDate } = req.body as ScanRequestBody;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({
          error: 'Envie uma imagem válida do recibo, nota fiscal ou conta.',
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const validMimeType =
        mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
      const fallbackDate =
        todayDate && /^\d{4}-\d{2}-\d{2}$/.test(todayDate)
          ? todayDate
          : new Date().toISOString().split('T')[0];

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Você é um assistente financeiro especialista em leitura de documentos fiscais e contas brasileiras (cupons fiscais NFC-e/SAT, notas fiscais NF-e, recibos de compra, comprovantes Pix/cartão, contas de água como Sabesp/Copasa/Cedae/Sanepar, contas de luz/energia como Enel/Cemig/CPFL/Light/Equatorial, contas de gás, internet e boletos).

Analise a imagem enviada e extraia os dados exatos da despesa para registro automático no controle financeiro pessoal.

Regras obrigatórias:
1. Verifique se a imagem realmente mostra um recibo, cupom fiscal, nota fiscal, conta de consumo (água, luz, gás, internet), boleto ou comprovante de pagamento. Se NÃO for um documento financeiro legível (por exemplo, foto aleatória, selfie, paisagem, imagem totalmente borrada), defina isValidDocument como false e explique o motivo em rejectionReason em português claro.
2. Para documentos válidos, extraia:
   - description: Nome claro e amigável em português (ex: "Supermercado Pão de Açúcar", "Conta de Luz - Enel", "Conta de Água - Sabesp", "Farmácia Drogasil", "Padaria Central").
   - amount: Valor TOTAL a pagar ou valor total pago (número decimal positivo, ex: 168.40). Se houver desconto ou taxa já incluída no total final, use o valor líquido final pago/a pagar.
   - date: Data no formato YYYY-MM-DD. Para contas de água/luz/boleto, prefira a data de vencimento se visível (ou emissão). Para cupons e comprovantes pagos, use a data da compra/pagamento. Se não houver data legível, use "${fallbackDate}".
   - category: Escolha EXATAMENTE uma destas categorias: ${ALLOWED_CATEGORIES.join(', ')}.
     * Contas de água, luz, energia elétrica, gás, telefone, internet -> "Serviços & Contas"
     * Supermercados, restaurantes, padarias, lanchonetes, açougues, delivery -> "Alimentação"
     * Aluguel, condomínio, IPTU, manutenção residencial -> "Moradia"
     * Combustível, Uber/99, pedágio, estacionamento, passagens -> "Transporte"
     * Farmácia, consultas, exames, academia -> "Saúde & Cuidados"
     * Cinema, livros, streaming, passeios -> "Lazer & Cultura"
     * Cursos, escola, material escolar -> "Educação"
     * Caso não se encaixe, use "Outros".
   - account: Escolha EXATAMENTE uma destas formas de pagamento: ${ALLOWED_ACCOUNTS.join(', ')}.
     * Contas de água/luz/boletos -> "Boleto" (ou "Conta Corrente" se indicar débito automático).
     * Cupom pago no cartão de crédito -> "Cartão de Crédito"; débito -> "Conta Corrente"; Pix -> "Pix"; dinheiro/espécie -> "Dinheiro".
     * Se não estiver explícito, use "Cartão de Crédito" para compras comerciais ou "Boleto" para contas de consumo.
   - status: Use "pending" se for uma conta a vencer / boleto ainda não pago, ou "paid" se for um cupom fiscal já pago no ato, comprovante de pagamento ou nota já quitada.
   - notes: Resumo curto e útil em português com detalhes extras úteis encontrados no documento (ex: itens principais, consumo kWh ou m³, mês de referência, CNPJ ou vencimento).`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: validMimeType,
                data: cleanBase64,
              },
            },
            {
              text: `Leia este documento (recibo, nota fiscal, conta de água, conta de luz ou comprovante) e extraia os dados estruturados em JSON. Data de referência de hoje: ${fallbackDate}.`,
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidDocument: {
                type: Type.BOOLEAN,
                description:
                  'Verdadeiro se a imagem mostrar um recibo, nota fiscal, conta de água/luz, boleto ou comprovante legível.',
              },
              documentType: {
                type: Type.STRING,
                description:
                  'Tipo de documento identificado (ex: Cupom Fiscal, Conta de Luz, Conta de Água, Nota Fiscal, Comprovante Pix).',
              },
              description: {
                type: Type.STRING,
                description:
                  'Nome resumido do estabelecimento ou conta para o extrato.',
              },
              amount: {
                type: Type.NUMBER,
                description: 'Valor total final do débito em número positivo.',
              },
              date: {
                type: Type.STRING,
                description: 'Data do documento ou vencimento no formato YYYY-MM-DD.',
              },
              category: {
                type: Type.STRING,
                description: `Categoria exata dentre: ${ALLOWED_CATEGORIES.join(', ')}`,
              },
              account: {
                type: Type.STRING,
                description: `Forma de pagamento exata dentre: ${ALLOWED_ACCOUNTS.join(', ')}`,
              },
              status: {
                type: Type.STRING,
                description: 'Status do pagamento: paid ou pending.',
              },
              notes: {
                type: Type.STRING,
                description:
                  'Resumo curto dos itens, consumo (kWh/m³) ou referência extraída.',
              },
              confidence: {
                type: Type.STRING,
                description: 'Nível de confiança da leitura: alta, media ou baixa.',
              },
              rejectionReason: {
                type: Type.STRING,
                description:
                  'Motivo caso isValidDocument seja false (em português).',
              },
            },
            required: [
              'isValidDocument',
              'documentType',
              'description',
              'amount',
              'date',
              'category',
              'account',
              'status',
              'notes',
              'confidence',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({
          error: 'A IA não retornou resposta legível para esta imagem. Tente novamente.',
        });
      }

      const parsed = JSON.parse(rawText) as ParsedReceiptResponse;

      if (!parsed.isValidDocument) {
        return res.status(422).json({
          error:
            parsed.rejectionReason ||
            'Não foi possível identificar um recibo, nota fiscal ou conta nesta imagem. Tente fotografar em um local bem iluminado.',
        });
      }

      const numericAmount = Number(parsed.amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(422).json({
          error:
            'A IA identificou o documento, mas o valor total não ficou legível. Tente aproximar a câmera do valor final.',
        });
      }

      return res.json({
        documentType: parsed.documentType || 'Recibo',
        description: (parsed.description || 'Despesa escaneada').trim(),
        amount: Math.round(numericAmount * 100) / 100,
        date: normalizeDate(parsed.date, fallbackDate),
        category: normalizeCategory(parsed.category),
        account: normalizeAccount(parsed.account),
        status: parsed.status === 'pending' ? 'pending' : 'paid',
        notes: (parsed.notes || '').trim(),
        confidence:
          parsed.confidence === 'alta' ||
          parsed.confidence === 'media' ||
          parsed.confidence === 'baixa'
            ? parsed.confidence
            : 'media',
      });
    } catch (err: unknown) {
      console.error('Erro ao ler recibo com Gemini:', err);
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido ao processar imagem.';

      if (
        message.includes('PERMISSION_DENIED') ||
        message.includes('API_KEY_INVALID') ||
        message.includes('API key not valid') ||
        message.includes('403')
      ) {
        return res.status(403).json({
          error:
            'Erro de autenticação com a API Gemini. Verifique sua chave em Settings > Secrets.',
        });
      }

      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        return res.status(429).json({
          error:
            'Limite de solicitações da IA atingido temporariamente. Aguarde alguns instantes e tente novamente.',
        });
      }

      return res.status(500).json({
        error: `Falha ao analisar o documento: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aconchego Finanças rodando na porta ${PORT}`);
  });
}

startServer();
