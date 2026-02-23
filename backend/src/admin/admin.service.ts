import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
  ) {}

  async getDashboardStats(): Promise<object> {
    const [totalUsers, totalBusinesses, totalActive] = await Promise.all([
      this.userModel.countDocuments(),
      this.businessModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
    ]);
    return {
      totalUsers,
      totalBusinesses,
      totalActiveUsers: totalActive,
      timestamp: new Date().toISOString(),
    };
  }

  async getPendingBusinesses(): Promise<BusinessDocument[]> {
    return this.businessModel
      .find({ isVerified: false, isActive: true })
      .populate('owner', 'firstName lastName email')
      .exec();
  }

  async verifyBusiness(
    id: string,
    approved: boolean,
    notes?: string,
  ): Promise<BusinessDocument> {
    return this.businessModel
      .findByIdAndUpdate(id, { isVerified: approved }, { new: true })
      .exec();
  }

  async suspendUser(id: string, reason?: string): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }

  async getAllUsers(
    page = 1,
    limit = 20,
  ): Promise<{ data: UserDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(),
    ]);
    return { data, total, page, limit };
  }

  async getAllBusinesses(
    page = 1,
    limit = 20,
  ): Promise<{ data: BusinessDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.businessModel
        .find()
        .populate('owner', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.businessModel.countDocuments(),
    ]);
    return { data, total, page, limit };
  }

  async updateBusinessStatus(id: string, isActive: boolean): Promise<BusinessDocument> {
    return this.businessModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();
  }

  async updateUserStatus(id: string, isActive: boolean, reason?: string): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();
  }
}
