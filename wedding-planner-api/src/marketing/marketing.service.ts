import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFaqItemDto,
  CreateProcessStepDto,
  CreateServiceTierDto,
  CreateTestimonialDto,
  UpdateFaqItemDto,
  UpdateProcessStepDto,
  UpdateServiceTierDto,
  UpdateTestimonialDto,
} from './dto/marketing.dto';

/** A service tier with its newline-stored lists split back into arrays. */
export interface ServiceTierView extends Omit<
  ServiceTier,
  'includedBefore' | 'includedOnDay' | 'excluded'
> {
  includedBefore: string[];
  includedOnDay: string[];
  excluded: string[];
}

/** Everything the public marketing pages need, in one response. */
export interface PublicMarketingContent {
  serviceTiers: ServiceTierView[];
  processSteps: Array<{ id: string; title: string; body: string }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  testimonials: Array<{ id: string; names: string; context: string | null; quote: string }>;
}

/** The list models the ordering helpers can work with. */
type OrderedModel = 'faqItem' | 'testimonial' | 'processStep' | 'serviceTier';

/** The slice of a Prisma delegate the ordering helpers need. */
interface OrderedDelegate {
  findFirst(args: {
    orderBy: { order: 'desc' };
    select: { order: true };
  }): Promise<{ order: number } | null>;
  findUnique(args: {
    where: { id: string };
    select: { id: true };
  }): Promise<{ id: string } | null>;
  update(args: { where: { id: string }; data: { order: number } }): Prisma.PrismaPromise<unknown>;
}

/** The four list models share this ordering, so the lookups do too. */
const PUBLISHED_IN_ORDER = {
  where: { published: true },
  orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
};

const ADMIN_IN_ORDER = {
  orderBy: [{ order: 'asc' as const }, { createdAt: 'asc' as const }],
};

function toLines(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join('\n');
}

function fromLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One request for the whole public site. Unpublished rows never leave the
   * API, and an empty list is returned as an empty array - the site then hides
   * that section rather than rendering an empty one.
   */
  async getPublicContent(): Promise<PublicMarketingContent> {
    const [serviceTiers, processSteps, faqs, testimonials] = await Promise.all([
      this.prisma.serviceTier.findMany(PUBLISHED_IN_ORDER),
      this.prisma.processStep.findMany({
        ...PUBLISHED_IN_ORDER,
        select: { id: true, title: true, body: true },
      }),
      this.prisma.faqItem.findMany({
        ...PUBLISHED_IN_ORDER,
        select: { id: true, question: true, answer: true },
      }),
      this.prisma.testimonial.findMany({
        ...PUBLISHED_IN_ORDER,
        select: { id: true, names: true, context: true, quote: true },
      }),
    ]);

    return {
      serviceTiers: serviceTiers.map((tier) => this.toTierView(tier)),
      processSteps,
      faqs,
      testimonials,
    };
  }

  /* ---- FAQ ----------------------------------------------------------- */

  listFaqs() {
    return this.prisma.faqItem.findMany(ADMIN_IN_ORDER);
  }

  async createFaq(dto: CreateFaqItemDto) {
    return this.prisma.faqItem.create({
      data: { ...dto, order: dto.order ?? (await this.nextOrder('faqItem')) },
    });
  }

  async updateFaq(id: string, dto: UpdateFaqItemDto) {
    await this.assertExists('faqItem', id);
    return this.prisma.faqItem.update({ where: { id }, data: dto });
  }

  async removeFaq(id: string) {
    await this.assertExists('faqItem', id);
    return this.prisma.faqItem.delete({ where: { id } });
  }

  reorderFaqs(ids: string[]) {
    return this.applyOrder('faqItem', ids);
  }

  /* ---- testimonials -------------------------------------------------- */

  listTestimonials() {
    return this.prisma.testimonial.findMany(ADMIN_IN_ORDER);
  }

  async createTestimonial(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: { ...dto, order: dto.order ?? (await this.nextOrder('testimonial')) },
    });
  }

  async updateTestimonial(id: string, dto: UpdateTestimonialDto) {
    await this.assertExists('testimonial', id);
    return this.prisma.testimonial.update({ where: { id }, data: dto });
  }

  async removeTestimonial(id: string) {
    await this.assertExists('testimonial', id);
    return this.prisma.testimonial.delete({ where: { id } });
  }

  reorderTestimonials(ids: string[]) {
    return this.applyOrder('testimonial', ids);
  }

  /* ---- process steps ------------------------------------------------- */

  listProcessSteps() {
    return this.prisma.processStep.findMany(ADMIN_IN_ORDER);
  }

  async createProcessStep(dto: CreateProcessStepDto) {
    return this.prisma.processStep.create({
      data: { ...dto, order: dto.order ?? (await this.nextOrder('processStep')) },
    });
  }

  async updateProcessStep(id: string, dto: UpdateProcessStepDto) {
    await this.assertExists('processStep', id);
    return this.prisma.processStep.update({ where: { id }, data: dto });
  }

  async removeProcessStep(id: string) {
    await this.assertExists('processStep', id);
    return this.prisma.processStep.delete({ where: { id } });
  }

  reorderProcessSteps(ids: string[]) {
    return this.applyOrder('processStep', ids);
  }

  /* ---- service tiers ------------------------------------------------- */

  async listServiceTiers(): Promise<ServiceTierView[]> {
    const tiers = await this.prisma.serviceTier.findMany(ADMIN_IN_ORDER);
    return tiers.map((tier) => this.toTierView(tier));
  }

  async createServiceTier(dto: CreateServiceTierDto): Promise<ServiceTierView> {
    const tier = await this.prisma.serviceTier.create({
      data: {
        ...dto,
        order: dto.order ?? (await this.nextOrder('serviceTier')),
        includedBefore: toLines(dto.includedBefore),
        includedOnDay: toLines(dto.includedOnDay),
        excluded: toLines(dto.excluded),
      },
    });
    return this.toTierView(tier);
  }

  async updateServiceTier(id: string, dto: UpdateServiceTierDto): Promise<ServiceTierView> {
    await this.assertExists('serviceTier', id);

    const data: Prisma.ServiceTierUpdateInput = { ...dto } as Prisma.ServiceTierUpdateInput;
    if (dto.includedBefore) data.includedBefore = toLines(dto.includedBefore);
    if (dto.includedOnDay) data.includedOnDay = toLines(dto.includedOnDay);
    if (dto.excluded) data.excluded = toLines(dto.excluded);

    const tier = await this.prisma.serviceTier.update({ where: { id }, data });
    return this.toTierView(tier);
  }

  async removeServiceTier(id: string) {
    await this.assertExists('serviceTier', id);
    return this.prisma.serviceTier.delete({ where: { id } });
  }

  reorderServiceTiers(ids: string[]) {
    return this.applyOrder('serviceTier', ids);
  }

  /* ---- shared -------------------------------------------------------- */

  private toTierView(tier: ServiceTier): ServiceTierView {
    return {
      ...tier,
      includedBefore: fromLines(tier.includedBefore),
      includedOnDay: fromLines(tier.includedOnDay),
      excluded: fromLines(tier.excluded),
    };
  }

  /** New items land at the end of the list. */
  private async nextOrder(model: OrderedModel): Promise<number> {
    const last = await this.delegate(model).findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  private async assertExists(model: OrderedModel, id: string): Promise<void> {
    const existing = await this.delegate(model).findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Item not found');
    }
  }

  /**
   * Writes the given order in one transaction: the admin sends the full id
   * list as displayed, so a half-applied reorder can never leave two items
   * claiming the same position.
   */
  private async applyOrder(model: OrderedModel, ids: string[]): Promise<{ updated: number }> {
    const delegate = this.delegate(model);

    await this.prisma.$transaction(
      ids.map((id, index) => delegate.update({ where: { id }, data: { order: index } })),
    );

    return { updated: ids.length };
  }

  /**
   * The four list models differ in their fields but share id/order/published,
   * which is all the helpers above touch. Narrowing to that shape here keeps
   * the cast in one place instead of at every call site.
   */
  private delegate(model: OrderedModel): OrderedDelegate {
    return this.prisma[model] as unknown as OrderedDelegate;
  }
}
