import { Controller, Get, Post } from '@nestjs/common'
import { SiteConfigService } from './site-config.service'
import { Role } from '@lesson-scheduler/shared'
import { Roles } from 'iam/authentication/decorators/roles.decorator'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SiteConfigResponseDto } from './dto/site-config-response.dto'

@ApiTags('SiteConfig')
@Controller('config')
export class SiteConfigController {
  constructor(private readonly configService: SiteConfigService) {}

  @Post('waitlist')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Toggle the waitlist status' })
  @ApiResponse({ status: 200, description: 'The updated site config', type: SiteConfigResponseDto })
  async toggleWaitlist() {
    const config = await this.configService.toggleWaitlist()
    return {
      id: config.id,
      waitlistEnabled: config.waitlistEnabled,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get the current site config' })
  @ApiResponse({ status: 200, description: 'The current site config', type: SiteConfigResponseDto })
  async findOne() {
    const config = await this.configService.findOne()
    return {
      id: config.id,
      waitlistEnabled: config.waitlistEnabled,
    }
  }
}
