import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff, StaffDocument } from './schemas/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

const FREE_PLAN_STAFF_LIMIT = 5;

@Injectable()
export class StaffService {
  constructor(@InjectModel(Staff.name) private staffModel: Model<StaffDocument>) {}

  async create(createStaffDto: CreateStaffDto): Promise<StaffDocument> {
    const existing = await this.staffModel.countDocuments({
      businessId: new Types.ObjectId(createStaffDto.businessId),
      isActive: true,
    });
    if (existing >= FREE_PLAN_STAFF_LIMIT) {
      throw new BadRequestException(
        `Staff limit reached. Free plan allows up to ${FREE_PLAN_STAFF_LIMIT} staff members. Please upgrade your plan to add more.`,
      );
    }

    const staff = new this.staffModel({
      ...createStaffDto,
      businessId: new Types.ObjectId(createStaffDto.businessId),
      assignedServices: (createStaffDto.assignedServices || []).map(
        (id) => new Types.ObjectId(id),
      ),
    });
    return staff.save();
  }

  async findAll(businessId: string): Promise<StaffDocument[]> {
    return this.staffModel
      .find({ businessId: new Types.ObjectId(businessId), isActive: true })
      .populate('assignedServices', 'name duration price')
      .exec();
  }

  async findOne(id: string): Promise<StaffDocument> {
    const staff = await this.staffModel
      .findById(id)
      .populate('assignedServices', 'name duration price')
      .exec();
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<StaffDocument> {
    const { assignedServices, ...rest } = updateStaffDto;
    const updateData: Record<string, unknown> = { ...rest };
    if (assignedServices) {
      updateData.assignedServices = assignedServices.map((sid) => new Types.ObjectId(sid));
    }
    const updated = await this.staffModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) throw new NotFoundException('Staff member not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const staff = await this.staffModel.findById(id);
    if (!staff) throw new NotFoundException('Staff member not found');
    await this.staffModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }

  async getStaffCount(businessId: string): Promise<{ count: number; limit: number }> {
    const count = await this.staffModel.countDocuments({
      businessId: new Types.ObjectId(businessId),
      isActive: true,
    });
    return { count, limit: FREE_PLAN_STAFF_LIMIT };
  }
}

