import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { EnquiriesService } from './enquiries.service';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  /**
   * Public and unauthenticated: an enquiry is a stranger's first contact.
   * Rate limited well below the global allowance, since an open write endpoint
   * is the obvious spam target on the site.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post()
  async create(@Body() dto: CreateEnquiryDto) {
    await this.enquiriesService.create(dto);
    // Nothing from the stored row is echoed back to an anonymous caller.
    return { received: true };
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.enquiriesService.findAll();
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  updateStatus(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateEnquiryStatusDto) {
    return this.enquiriesService.updateStatus(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.enquiriesService.remove(id);
  }
}
