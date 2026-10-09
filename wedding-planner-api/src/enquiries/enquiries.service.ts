import { Injectable, NotFoundException } from '@nestjs/common';
import { keyToUtcMidnight } from '../availability/slots.util';
import { EnquiryStatus } from '../common/enums/enquiry-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEnquiryDto) {
    return this.prisma.enquiry.create({
      data: {
        names: dto.names.trim(),
        email: dto.email.trim(),
        // Stored as a plain date marker: couples give a day, not an instant.
        weddingDate: dto.weddingDate ? keyToUtcMidnight(dto.weddingDate) : null,
        location: dto.location?.trim() || null,
        message: dto.message.trim(),
        status: EnquiryStatus.NEW,
      },
    });
  }

  findAll() {
    return this.prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, dto: UpdateEnquiryStatusDto) {
    const existing = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Enquiry not found');
    }

    return this.prisma.enquiry.update({
      where: { id },
      data: {
        status: dto.status,
        handledAt: dto.status === EnquiryStatus.NEW ? null : new Date(),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Enquiry not found');
    }
    return this.prisma.enquiry.delete({ where: { id } });
  }
}
