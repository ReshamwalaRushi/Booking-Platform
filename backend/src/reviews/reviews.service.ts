import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<ReviewDocument>) {}

  async create(createReviewDto: CreateReviewDto, clientId: string): Promise<ReviewDocument> {
    const review = new this.reviewModel({
      ...createReviewDto,
      clientId: new Types.ObjectId(clientId),
      businessId: new Types.ObjectId(createReviewDto.businessId),
      appointmentId: createReviewDto.appointmentId
        ? new Types.ObjectId(createReviewDto.appointmentId)
        : undefined,
    });
    return review.save();
  }

  async findByBusiness(businessId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ businessId: new Types.ObjectId(businessId), isVisible: true })
      .populate('clientId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByClient(clientId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ clientId: new Types.ObjectId(clientId) })
      .populate('businessId', 'name logo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async respondToReview(
    reviewId: string,
    text: string,
    userId: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate<{ businessId: Document & { owner: Types.ObjectId } }>('businessId')
      .exec();
    if (!review) throw new NotFoundException('Review not found');

    const business = review.businessId as Document & { owner: Types.ObjectId };
    if (business && business.owner && business.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized to respond to this review');
    }

    return this.reviewModel
      .findByIdAndUpdate(
        reviewId,
        { response: { text, respondedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
