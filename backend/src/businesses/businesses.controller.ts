import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('category') category?: string) {
    return this.businessesService.findAll(category);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('owner/my-businesses')
  @ApiOperation({ summary: 'Get current user businesses' })
  findMyBusinesses(@CurrentUser() user: any) {
    return this.businessesService.findByOwner(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  create(@Body() createBusinessDto: CreateBusinessDto, @CurrentUser() user: any) {
    return this.businessesService.create(createBusinessDto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update business' })
  update(@Param('id') id: string, @Body() updateDto: UpdateBusinessDto, @CurrentUser() user: any) {
    return this.businessesService.update(id, updateDto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete business' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.businessesService.remove(id, user.userId);
  }
}
