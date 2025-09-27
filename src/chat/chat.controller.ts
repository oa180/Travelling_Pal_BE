import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

class SuggestDto {
  @ApiProperty({ example: 'I want to go to Bali next month with budget $1000', description: 'Natural language user prompt' })
  @IsString()
  prompt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 10, minimum: 1 })
  limit?: number;

  @IsOptional()
  @IsIn(['price:asc', 'price:desc', 'rating:desc'])
  @ApiPropertyOptional({ enum: ['price:asc', 'price:desc', 'rating:desc'] })
  sort?: 'price:asc' | 'price:desc' | 'rating:desc';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'b8c5e2c2-6f2a-4f7b-9d9f-1c2a3b4d5e6f', description: 'Use the conversationId from the previous response to continue the dialogue' })
  conversationId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'If true, do not relax filters when no results are found' })
  strict?: boolean;
}

class ExtractedIntentDto {
  @ApiProperty({ type: [String], required: false, description: 'Destination string or null', example: 'Bali, Indonesia', nullable: true })
  destination: string | null;
  @ApiProperty({ nullable: true }) country: string | null;
  @ApiProperty({ nullable: true }) continent: string | null;
  @ApiProperty({ nullable: true }) budgetMin: number | null;
  @ApiProperty({ nullable: true }) budgetMax: number | null;
  @ApiProperty({ nullable: true }) durationDays: number | null;
  @ApiProperty({ nullable: true }) month: number | null;
  @ApiProperty({ nullable: true }) year: number | null;
  @ApiProperty({ nullable: true }) transportType: string | null;
  @ApiProperty({ nullable: true }) accommodationLevel: string | null;
  @ApiProperty({ nullable: true }) peopleCount: number | null;
  @ApiProperty({ type: [String] }) mustInclude: string[];
  @ApiProperty({ type: [String] }) niceToHave: string[];
  @ApiProperty({ nullable: true }) notes: string | null;
}

class ChatSuggestResponseDto {
  @ApiProperty({ example: 'b8c5e2c2-6f2a-4f7b-9d9f-1c2a3b4d5e6f' }) conversationId: string;
  @ApiProperty({ type: ExtractedIntentDto }) extracted: ExtractedIntentDto;
  @ApiProperty({ description: 'Matching offers list', type: 'array', items: { type: 'object' } }) offers: any[];
  @ApiProperty({ description: 'Single follow-up question to ask next', nullable: true, example: 'Any budget range in mind?' }) nextQuestion: string | null;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'LLM-powered trip suggestions from a natural language prompt' })
  @ApiOkResponse({ description: 'Suggestions returned successfully', type: ChatSuggestResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiBody({ type: SuggestDto, required: true })
  async suggest(@Body() body: SuggestDto) {
    const { prompt, limit, sort, conversationId, strict } = body;
    const result = await this.chatService.suggest(prompt, limit, sort, conversationId, strict);
    return {
      conversationId: result.conversationId,
      extracted: result.extracted,
      offers: result.offers,
      nextQuestion: result.nextQuestion,
    };
  }
}
