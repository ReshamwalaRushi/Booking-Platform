import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(@InjectModel(Service.name) private serviceModel: Model<ServiceDocument>) {}

  async create(createServiceDto: CreateServiceDto): Promise<ServiceDocument> {
    const service = new this.serviceModel({
      ...createServiceDto,
      business: new Types.ObjectId(createServiceDto.businessId),
    });
    return service.save();
  }

  async findAll(businessId?: string): Promise<ServiceDocument[]> {
    const filter: any = { isActive: true };
    if (businessId) filter.business = new Types.ObjectId(businessId);
    return this.serviceModel.find(filter).populate('business', 'name category').exec();
  }

  async findOne(id: string): Promise<ServiceDocument> {
    const service = await this.serviceModel
      .findById(id)
      .populate('business', 'name category')
      .exec();
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, updateDto: UpdateServiceDto): Promise<ServiceDocument> {
    const service = await this.serviceModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async remove(id: string): Promise<void> {
    await this.serviceModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }
}
