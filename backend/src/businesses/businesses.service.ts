import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(@InjectModel(Business.name) private businessModel: Model<BusinessDocument>) {}

  async create(createBusinessDto: CreateBusinessDto, ownerId: string): Promise<BusinessDocument> {
    const business = new this.businessModel({
      ...createBusinessDto,
      owner: new Types.ObjectId(ownerId),
    });
    return business.save();
  }

  async findAll(category?: string): Promise<BusinessDocument[]> {
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    return this.businessModel.find(filter).populate('owner', 'firstName lastName email').exec();
  }

  async findOne(id: string): Promise<BusinessDocument> {
    const business = await this.businessModel
      .findById(id)
      .populate('owner', 'firstName lastName email')
      .exec();
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findByOwner(ownerId: string): Promise<BusinessDocument[]> {
    return this.businessModel.find({ owner: new Types.ObjectId(ownerId) }).exec();
  }

  async update(id: string, updateDto: UpdateBusinessDto, userId: string): Promise<BusinessDocument> {
    const business = await this.businessModel.findById(id);
    if (!business) throw new NotFoundException('Business not found');
    if (business.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    return this.businessModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const business = await this.businessModel.findById(id);
    if (!business) throw new NotFoundException('Business not found');
    if (business.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    await this.businessModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }
}
