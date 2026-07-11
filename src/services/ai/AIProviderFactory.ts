import { AIProvider, AIProviderType } from './AIProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
// import { GeminiProvider } from './GeminiProvider';
// import { OpenAIProvider } from './OpenAIProvider';

export class AIProviderFactory {
  static create(type: AIProviderType = AIProviderType.DEEPSEEK): AIProvider {
    switch (type) {
      case AIProviderType.DEEPSEEK:
        return new DeepSeekProvider();
      // case AIProviderType.GEMINI:
      //   return new GeminiProvider();
      // case AIProviderType.OPENAI:
      //   return new OpenAIProvider();
      default:
        return new DeepSeekProvider();
    }
  }
}