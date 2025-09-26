import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatSuggestDto } from './dto/chat-suggest.dto';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'LLM-powered trip suggestions from a natural language prompt' })
  @ApiOkResponse({ description: 'Suggestions returned successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async suggest(@Body() dto: ChatSuggestDto) {
    const { prompt, limit, sort } = dto;
    const result = await this.chat.suggest(prompt, limit, sort);
    return result;
  }
}
