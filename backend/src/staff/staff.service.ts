import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff, StaffDocument } from './schemas/staff.schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(@InjectModel(Staff.name) private staffModel: Model<StaffDocument>) {}

  async create(createStaffDto: CreateStaffDto): Promise<StaffDocument> {
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
    const staff = await this.staffModel.findById(id);
    if (!staff) throw new NotFoundException('Staff member not found');
    const { assignedServices, ...rest } = updateStaffDto;
    const updateData: Record<string, unknown> = { ...rest };
    if (assignedServices) {
      updateData.assignedServices = assignedServices.map((sid) => new Types.ObjectId(sid));
    }
    return this.staffModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async remove(id: string): Promise<void> {
    const staff = await this.staffModel.findById(id);
    if (!staff) throw new NotFoundException('Staff member not found');
    await this.staffModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }
}
