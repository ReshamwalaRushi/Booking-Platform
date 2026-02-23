import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Get reviews for a business' })
  findByBusiness(@Param('businessId') businessId: string) {
    return this.reviewsService.findByBusiness(businessId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-reviews')
  @ApiOperation({ summary: 'Get reviews by current client' })
  findMyReviews(@CurrentUser() user: any) {
    return this.reviewsService.findByClient(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a review' })
  create(@Body() createReviewDto: CreateReviewDto, @CurrentUser() user: any) {
    return this.reviewsService.create(createReviewDto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to a review (business owner)' })
  respond(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.respondToReview(id, text, user.userId);
  }
}
