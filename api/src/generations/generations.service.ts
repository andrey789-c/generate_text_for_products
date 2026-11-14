import {
  Injectable,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbortableAsyncIterator, GenerateResponse, Ollama } from 'ollama';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

export interface GeneratedContent {
  description: string;
  shortDescription: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface ProductGenerationInput {
  name: string;
  brand?: string | null;
  category?: string | null;
  features: string[];
  targetAudience?: string | null;
}

export interface GenerationSettings {
  tone: string;
  language: string;
  length: string;
  variants: number;
}

export type StreamingGenerationEvent =
  | { type: 'start'; data: { variants: number } }
  | { type: 'variant_start'; data: { variantIndex: number } }
  | {
      type: 'content';
      data: {
        variantIndex: number;
        field: keyof GeneratedContent;
        content: string;
      };
    }
  | {
      type: 'variant_complete';
      data: {
        variantIndex: number;
        generation: GeneratedContent & { id: string };
      };
    }
  | {
      type: 'complete';
      data: {
        productId: string;
        generations: Array<GeneratedContent & { id: string }>;
      };
    }
  | { type: 'error'; data: { message: string; variantIndex?: number } };

@Injectable()
export class GenerationsService {
  private readonly ollama: Ollama;
  private readonly ollamaHost: string;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ollamaHost = this.configService.getOrThrow<string>('OLLAMA_HOST');
    this.ollama = new Ollama({ host: this.ollamaHost });

    this.model = this.configService.getOrThrow<string>('OLLAMA_MODEL');
  }

  async create(dto: CreateGenerationDto) {
    const tone = dto.tone ?? 'professional';
    const language = dto.language ?? 'ru';
    const length = dto.length ?? 'medium';
    const variants = dto.variants ?? 1;

    const selectedProduct = dto.productId
      ? await this.prisma.product.findUnique({ where: { id: dto.productId } })
      : null;

    if (dto.productId && !selectedProduct) {
      throw new NotFoundException('Товар не найден');
    }

    const productContext = {
      name: selectedProduct?.name ?? dto.productName ?? '',
      brand: selectedProduct?.brand ?? dto.brand,
      category: selectedProduct?.category ?? dto.category,
      features: selectedProduct?.features ?? dto.features ?? [],
      targetAudience: selectedProduct?.targetAudience ?? dto.targetAudience,
    };

    const toneInstructions: Record<string, string> = {
      professional: 'Профессиональный, информативный и экспертный стиль.',
      sales: 'Продающий стиль с акцентом на преимущества и пользу товара.',
      friendly: 'Дружелюбный, простой и понятный стиль общения.',
      premium: 'Премиальный стиль, подчёркивающий качество и ценность товара.',
      seo: 'SEO-оптимизированный стиль с естественным использованием ключевых слов.',
    };

    const lengthInstructions: Record<string, string> = {
      short: '50–100 слов.',
      medium: '100–200 слов.',
      long: '200–350 слов.',
    };

    const generateContent = async (
      index: number,
    ): Promise<GeneratedContent> => {
      const prompt = `
Ты профессиональный копирайтер интернет-магазина и SEO-специалист.

Создай полный комплект контента для карточки товара.

ДАННЫЕ ТОВАРА:
Название: ${productContext.name}
Бренд: ${productContext.brand ?? 'Не указан'}
Категория: ${productContext.category ?? 'Не указана'}
Характеристики: ${productContext.features.join(', ')}
Целевая аудитория: ${productContext.targetAudience ?? 'Широкая аудитория'}

СТИЛЬ:
${toneInstructions[tone]}

ДЛИНА ОСНОВНОГО ОПИСАНИЯ:
${lengthInstructions[length]}

ЯЗЫК: ${language}

ВАРИАНТ: ${index + 1} из ${variants}.

ТРЕБОВАНИЯ:
- Пиши естественно и грамотно.
- Подчеркни реальные преимущества товара.
- Не придумывай характеристики, которых нет во входных данных.
- Не используй чрезмерные рекламные обещания.
- SEO-заголовок должен быть информативным и привлекательным.
- Meta Description должен кратко описывать товар.
- Keywords должны содержать 5–10 релевантных ключевых фраз.
- Краткое описание должно подходить для карточки товара.
- Каждый вариант должен иметь немного другую подачу.

ВЕРНИ ТОЛЬКО JSON С ТАКОЙ СТРУКТУРОЙ:
{
  "description": "Основное описание товара",
  "shortDescription": "Краткое описание",
  "seoTitle": "SEO заголовок",
  "metaDescription": "Meta Description",
  "keywords": ["ключевое слово 1", "ключевое слово 2"]
}
`;

      try {
        const response = await this.ollama.generate({
          model: this.model,
          prompt,
          format: 'json',
          stream: false,
        });

        const rawResponse = response.response;

        if (!rawResponse?.trim()) {
          throw new Error('AI-модель вернула пустой ответ');
        }

        const content = JSON.parse(rawResponse) as GeneratedContent;

        if (
          typeof content.description !== 'string' ||
          !content.description.trim() ||
          typeof content.shortDescription !== 'string' ||
          typeof content.seoTitle !== 'string' ||
          typeof content.metaDescription !== 'string' ||
          !Array.isArray(content.keywords) ||
          !content.keywords.every((keyword) => typeof keyword === 'string')
        ) {
          throw new Error('AI-модель вернула ответ неверной структуры');
        }

        return {
          description: content.description.trim(),
          shortDescription: content.shortDescription.trim(),
          seoTitle: content.seoTitle.trim(),
          metaDescription: content.metaDescription.trim(),
          keywords: content.keywords,
        };
      } catch {
        throw new ServiceUnavailableException(
          'Не удалось получить корректный результат от AI-модели. Попробуйте ещё раз.',
        );
      }
    };

    const descriptions: GeneratedContent[] = [];

    for (let i = 0; i < variants; i++) {
      descriptions.push(await generateContent(i));
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const savedProduct =
        selectedProduct ??
        (await tx.product.create({
          data: {
            name: productContext.name,
            brand: productContext.brand,
            category: productContext.category,
            features: productContext.features,
            targetAudience: productContext.targetAudience,
          },
        }));

      const generations = await Promise.all(
        descriptions.map((content) =>
          tx.generation.create({
            data: {
              productId: savedProduct.id,
              description: content.description,
              shortDescription: content.shortDescription,
              seoTitle: content.seoTitle,
              metaDescription: content.metaDescription,
              keywords: content.keywords,
              tone,
              language,
              model: this.model,
            },
          }),
        ),
      );

      return { savedProduct, generations };
    });

    return {
      productId: result.savedProduct.id,
      generations: result.generations,
    };
  }

  async stream(
    dto: CreateGenerationDto,
    emit: (event: StreamingGenerationEvent) => void,
    registerAbort: (abort: () => void) => void,
    isAborted: () => boolean,
  ) {
    const settings: GenerationSettings = {
      tone: dto.tone ?? 'professional',
      language: dto.language ?? 'ru',
      length: dto.length ?? 'medium',
      variants: dto.variants ?? 1,
    };
    const selectedProduct = dto.productId
      ? await this.prisma.product.findUnique({ where: { id: dto.productId } })
      : null;

    if (dto.productId && !selectedProduct) {
      throw new NotFoundException('Товар не найден');
    }

    const product: ProductGenerationInput = {
      name: selectedProduct?.name ?? dto.productName ?? '',
      brand: selectedProduct?.brand ?? dto.brand,
      category: selectedProduct?.category ?? dto.category,
      features: selectedProduct?.features ?? dto.features ?? [],
      targetAudience: selectedProduct?.targetAudience ?? dto.targetAudience,
    };
    let productId = selectedProduct?.id;
    let currentIterator: AbortableAsyncIterator<GenerateResponse> | undefined;
    const generations: Array<GeneratedContent & { id: string }> = [];
    const requestAbortController = new AbortController();
    const streamingOllama = new Ollama({
      host: this.ollamaHost,
      fetch: (input, init) =>
        fetch(input, { ...init, signal: requestAbortController.signal }),
    });

    registerAbort(() => {
      requestAbortController.abort();
      currentIterator?.abort();
    });
    emit({ type: 'start', data: { variants: settings.variants } });

    for (
      let variantIndex = 0;
      variantIndex < settings.variants;
      variantIndex += 1
    ) {
      if (isAborted()) return;
      emit({ type: 'variant_start', data: { variantIndex } });
      let rawResponse = '';
      const emittedLengths: Partial<Record<keyof GeneratedContent, number>> =
        {};

      try {
        currentIterator = await this.withTimeout(
          streamingOllama.generate({
            model: this.model,
            prompt: this.buildPrompt(product, settings, variantIndex),
            format: 'json',
            stream: true,
          }),
          30_000,
        );

        const iterator = currentIterator[Symbol.asyncIterator]();
        while (true) {
          const next = await this.withTimeout(iterator.next(), 30_000);
          if (next.done) break;
          const chunk = next.value;
          if (isAborted()) {
            currentIterator.abort();
            return;
          }
          rawResponse += chunk.response ?? '';
          for (const field of [
            'description',
            'shortDescription',
            'seoTitle',
            'metaDescription',
          ] as const) {
            const value = this.extractJsonStringField(rawResponse, field);
            const previousLength = emittedLengths[field] ?? 0;
            if (value.length > previousLength) {
              emittedLengths[field] = value.length;
              emit({
                type: 'content',
                data: {
                  variantIndex,
                  field,
                  content: value.slice(previousLength),
                },
              });
            }
          }
          const keywords = this.extractJsonStringArray(rawResponse, 'keywords');
          const previousKeywords = emittedLengths.keywords ?? 0;
          for (const keyword of keywords.slice(previousKeywords)) {
            emit({
              type: 'content',
              data: { variantIndex, field: 'keywords', content: keyword },
            });
          }
          emittedLengths.keywords = keywords.length;
        }
        currentIterator = undefined;
        const content = this.parseGeneratedContent(rawResponse);
        const saved = await this.prisma.$transaction(async (tx) => {
          const savedProduct =
            productId ??
            (
              await tx.product.create({
                data: {
                  name: product.name,
                  brand: product.brand,
                  category: product.category,
                  features: product.features,
                  targetAudience: product.targetAudience,
                },
              })
            ).id;
          productId = savedProduct;
          return tx.generation.create({
            data: {
              productId: savedProduct,
              ...content,
              tone: settings.tone,
              language: settings.language,
              model: this.model,
            },
          });
        });
        const generation = { ...content, id: saved.id };
        generations.push(generation);
        emit({ type: 'variant_complete', data: { variantIndex, generation } });
      } catch (error) {
        if (isAborted()) return;
        const message =
          error instanceof ServiceUnavailableException
            ? error.message
            : 'Не удалось получить корректный результат от AI-модели.';
        emit({ type: 'error', data: { message, variantIndex } });
        return;
      }
    }

    if (productId) {
      emit({ type: 'complete', data: { productId, generations } });
    }
  }

  private buildPrompt(
    product: ProductGenerationInput,
    settings: GenerationSettings,
    index: number,
  ) {
    const toneInstructions: Record<string, string> = {
      professional: 'Профессиональный, информативный и экспертный стиль.',
      sales: 'Продающий стиль с акцентом на преимущества и пользу товара.',
      friendly: 'Дружелюбный, простой и понятный стиль общения.',
      premium: 'Премиальный стиль, подчёркивающий качество и ценность товара.',
      seo: 'SEO-оптимизированный стиль с естественным использованием ключевых слов.',
    };
    const lengthInstructions: Record<string, string> = {
      short: '50–100 слов.',
      medium: '100–200 слов.',
      long: '200–350 слов.',
    };
    return `Ты профессиональный копирайтер интернет-магазина и SEO-специалист.
Создай полный комплект контента для карточки товара.

ДАННЫЕ ТОВАРА:
Название: ${product.name}
Бренд: ${product.brand ?? 'Не указан'}
Категория: ${product.category ?? 'Не указана'}
Характеристики: ${product.features.join(', ')}
Целевая аудитория: ${product.targetAudience ?? 'Широкая аудитория'}

СТИЛЬ: ${toneInstructions[settings.tone] ?? toneInstructions.professional}
ДЛИНА: ${lengthInstructions[settings.length] ?? lengthInstructions.medium}
ЯЗЫК: ${settings.language}
ВАРИАНТ: ${index + 1} из ${settings.variants}.

Не придумывай характеристики, которых нет во входных данных. Верни только JSON:
{"description":"...","shortDescription":"...","seoTitle":"...","metaDescription":"...","keywords":["..."]}`;
  }

  private extractJsonStringField(raw: string, field: string) {
    const match = raw.match(
      new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)`),
    );
    if (!match) return '';
    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      return '';
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
    let timeout: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new ServiceUnavailableException(
                  'AI-модель не отвечает более 30 секунд.',
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private extractJsonStringArray(raw: string, field: string) {
    const match = raw.match(
      new RegExp(`"${field}"\\s*:\\s*\\[((?:.|\\n)*?)(?:\\]|$)`),
    );
    if (!match) return [];
    const values: string[] = [];
    const itemPattern = /"((?:\\.|[^"\\])*)"/g;
    for (const item of match[1].matchAll(itemPattern)) {
      try {
        values.push(JSON.parse(`"${item[1]}"`) as string);
      } catch {
        // Wait for the rest of a split JSON string in the next chunk.
      }
    }
    return values;
  }

  private parseGeneratedContent(raw: string): GeneratedContent {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new ServiceUnavailableException('AI вернула некорректный JSON.');
    }
    const content = parsed as Partial<GeneratedContent>;
    if (
      typeof content.description !== 'string' ||
      !content.description.trim() ||
      typeof content.shortDescription !== 'string' ||
      typeof content.seoTitle !== 'string' ||
      typeof content.metaDescription !== 'string' ||
      !Array.isArray(content.keywords) ||
      !content.keywords.every((keyword) => typeof keyword === 'string')
    ) {
      throw new ServiceUnavailableException('AI вернула неполный результат.');
    }
    return {
      description: content.description.trim(),
      shortDescription: content.shortDescription.trim(),
      seoTitle: content.seoTitle.trim(),
      metaDescription: content.metaDescription.trim(),
      keywords: content.keywords as string[],
    };
  }

  async generateContents(
    product: ProductGenerationInput,
    settings: GenerationSettings,
  ): Promise<GeneratedContent[]> {
    const toneInstructions: Record<string, string> = {
      professional: 'Профессиональный, информативный и экспертный стиль.',
      sales: 'Продающий стиль с акцентом на преимущества и пользу товара.',
      friendly: 'Дружелюбный, простой и понятный стиль общения.',
      premium: 'Премиальный стиль, подчёркивающий качество и ценность товара.',
      seo: 'SEO-оптимизированный стиль с естественным использованием ключевых слов.',
    };
    const lengthInstructions: Record<string, string> = {
      short: '50–100 слов.',
      medium: '100–200 слов.',
      long: '200–350 слов.',
    };
    const results: GeneratedContent[] = [];

    for (let index = 0; index < settings.variants; index += 1) {
      const prompt = `Ты профессиональный копирайтер интернет-магазина и SEO-специалист.
Создай полный комплект контента для карточки товара.

ДАННЫЕ ТОВАРА:
Название: ${product.name}
Бренд: ${product.brand ?? 'Не указан'}
Категория: ${product.category ?? 'Не указана'}
Характеристики: ${product.features.join(', ')}
Целевая аудитория: ${product.targetAudience ?? 'Широкая аудитория'}

СТИЛЬ: ${toneInstructions[settings.tone] ?? toneInstructions.professional}
ДЛИНА: ${lengthInstructions[settings.length] ?? lengthInstructions.medium}
ЯЗЫК: ${settings.language}
ВАРИАНТ: ${index + 1} из ${settings.variants}.

Верни только JSON:
{"description":"...","shortDescription":"...","seoTitle":"...","metaDescription":"...","keywords":["..."]}`;

      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await this.ollama.generate({
            model: this.model,
            prompt,
            format: 'json',
            stream: false,
          });
          if (!response.response)
            throw new Error('AI-модель вернула пустой ответ');
          const content = JSON.parse(response.response) as GeneratedContent;
          if (
            typeof content.description !== 'string' ||
            !content.description.trim() ||
            typeof content.shortDescription !== 'string' ||
            typeof content.seoTitle !== 'string' ||
            typeof content.metaDescription !== 'string' ||
            !Array.isArray(content.keywords)
          ) {
            throw new Error('AI-модель вернула ответ неверной структуры');
          }
          results.push({
            description: content.description.trim(),
            shortDescription: content.shortDescription.trim(),
            seoTitle: content.seoTitle.trim(),
            metaDescription: content.metaDescription.trim(),
            keywords: content.keywords.filter(
              (keyword): keyword is string => typeof keyword === 'string',
            ),
          });
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) {
        throw new ServiceUnavailableException(
          'Не удалось получить корректный результат от AI-модели.',
        );
      }
    }
    return results;
  }

  async findAll(productId?: string, limit = 20) {
    return this.prisma.generation.findMany({
      where: productId ? { productId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const generation = await this.prisma.generation.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!generation) {
      throw new NotFoundException('Генерация не найдена');
    }

    return generation;
  }

  async remove(id: string) {
    const generation = await this.prisma.generation.findUnique({
      where: { id },
    });

    if (!generation) {
      throw new NotFoundException('Генерация не найдена');
    }

    await this.prisma.generation.delete({
      where: { id },
    });

    return {
      message: 'Генерация удалена',
    };
  }
}
