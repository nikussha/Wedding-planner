import { IsIn } from 'class-validator';
import { ENQUIRY_STATUSES, EnquiryStatus } from '../../common/enums/enquiry-status.enum';

export class UpdateEnquiryStatusDto {
  @IsIn(ENQUIRY_STATUSES)
  status!: EnquiryStatus;
}
