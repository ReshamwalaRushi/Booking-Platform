import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async getDashboardStats(): Promise<object> {
    const [totalUsers, totalBusinesses, totalActive, totalBookings, revenueAgg, bookingsByStatus] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.businessModel.countDocuments(),
        this.userModel.countDocuments({ isActive: true }),
        this.bookingModel.countDocuments(),
        this.bookingModel.aggregate([
          { $match: { status: BookingStatus.COMPLETED } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.bookingModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const statusMap: Record<string, number> = {};
    for (const s of bookingsByStatus) statusMap[s._id] = s.count;

    // Monthly bookings for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await this.bookingModel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', BookingStatus.COMPLETED] }, '$amount', 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthlyAgg.map((m) => ({
      month: monthNames[m._id.month - 1],
      bookings: m.count,
      revenue: m.revenue,
    }));

    return {
      totalUsers,
      totalBusinesses,
      totalActiveUsers: totalActive,
      totalClients: await this.userModel.countDocuments({ role: 'client' }),
      totalBookings,
      totalRevenue,
      bookingsByStatus: statusMap,
      monthlyData,
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
    const update: Record<string, unknown> = { isVerified: approved };
    if (notes) update['verificationNotes'] = notes;
    return this.businessModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async suspendUser(id: string, reason?: string): Promise<UserDocument> {
    const update: Record<string, unknown> = { isActive: false };
    if (reason) update['suspensionReason'] = reason;
    return this.userModel
      .findByIdAndUpdate(id, update, { new: true })
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
    const update: Record<string, unknown> = { isActive };
    if (!isActive && reason) update['suspensionReason'] = reason;
    return this.userModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }
}
