import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import {
  CreateFaqItemDto,
  CreateProcessStepDto,
  CreateServiceTierDto,
  CreateTestimonialDto,
  ReorderDto,
  UpdateFaqItemDto,
  UpdateProcessStepDto,
  UpdateServiceTierDto,
  UpdateTestimonialDto,
} from './dto/marketing.dto';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  /** Public: every list the marketing pages render, published rows only. */
  @Public()
  @Get()
  getPublicContent() {
    return this.marketingService.getPublicContent();
  }

  /* ---- FAQ ----------------------------------------------------------- */

  @Roles(Role.ADMIN)
  @Get('faq')
  listFaqs() {
    return this.marketingService.listFaqs();
  }

  @Roles(Role.ADMIN)
  @Post('faq')
  createFaq(@Body() dto: CreateFaqItemDto) {
    return this.marketingService.createFaq(dto);
  }

  @Roles(Role.ADMIN)
  @Put('faq/order')
  reorderFaqs(@Body() dto: ReorderDto) {
    return this.marketingService.reorderFaqs(dto.ids);
  }

  @Roles(Role.ADMIN)
  @Patch('faq/:id')
  updateFaq(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateFaqItemDto) {
    return this.marketingService.updateFaq(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('faq/:id')
  removeFaq(@Param('id', ParseCuidPipe) id: string) {
    return this.marketingService.removeFaq(id);
  }

  /* ---- testimonials -------------------------------------------------- */

  @Roles(Role.ADMIN)
  @Get('testimonials')
  listTestimonials() {
    return this.marketingService.listTestimonials();
  }

  @Roles(Role.ADMIN)
  @Post('testimonials')
  createTestimonial(@Body() dto: CreateTestimonialDto) {
    return this.marketingService.createTestimonial(dto);
  }

  @Roles(Role.ADMIN)
  @Put('testimonials/order')
  reorderTestimonials(@Body() dto: ReorderDto) {
    return this.marketingService.reorderTestimonials(dto.ids);
  }

  @Roles(Role.ADMIN)
  @Patch('testimonials/:id')
  updateTestimonial(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateTestimonialDto) {
    return this.marketingService.updateTestimonial(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('testimonials/:id')
  removeTestimonial(@Param('id', ParseCuidPipe) id: string) {
    return this.marketingService.removeTestimonial(id);
  }

  /* ---- process steps ------------------------------------------------- */

  @Roles(Role.ADMIN)
  @Get('process')
  listProcessSteps() {
    return this.marketingService.listProcessSteps();
  }

  @Roles(Role.ADMIN)
  @Post('process')
  createProcessStep(@Body() dto: CreateProcessStepDto) {
    return this.marketingService.createProcessStep(dto);
  }

  @Roles(Role.ADMIN)
  @Put('process/order')
  reorderProcessSteps(@Body() dto: ReorderDto) {
    return this.marketingService.reorderProcessSteps(dto.ids);
  }

  @Roles(Role.ADMIN)
  @Patch('process/:id')
  updateProcessStep(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateProcessStepDto) {
    return this.marketingService.updateProcessStep(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('process/:id')
  removeProcessStep(@Param('id', ParseCuidPipe) id: string) {
    return this.marketingService.removeProcessStep(id);
  }

  /* ---- service tiers ------------------------------------------------- */

  @Roles(Role.ADMIN)
  @Get('service-tiers')
  listServiceTiers() {
    return this.marketingService.listServiceTiers();
  }

  @Roles(Role.ADMIN)
  @Post('service-tiers')
  createServiceTier(@Body() dto: CreateServiceTierDto) {
    return this.marketingService.createServiceTier(dto);
  }

  @Roles(Role.ADMIN)
  @Put('service-tiers/order')
  reorderServiceTiers(@Body() dto: ReorderDto) {
    return this.marketingService.reorderServiceTiers(dto.ids);
  }

  @Roles(Role.ADMIN)
  @Patch('service-tiers/:id')
  updateServiceTier(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateServiceTierDto) {
    return this.marketingService.updateServiceTier(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('service-tiers/:id')
  removeServiceTier(@Param('id', ParseCuidPipe) id: string) {
    return this.marketingService.removeServiceTier(id);
  }
}
