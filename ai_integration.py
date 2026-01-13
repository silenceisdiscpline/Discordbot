"""
AI Integration Module for Discord Bot
Provides AI moderation, image generation, auto-response, and advanced AI features
"""

import discord
from discord.ext import commands
import asyncio
import aiohttp
from typing import Optional, List, Dict, Any
import json
import logging
from datetime import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIConfig:
    """Configuration for AI services"""
    
    def __init__(self):
        self.openai_api_key = ""
        self.huggingface_api_key = ""
        self.stability_api_key = ""
        self.moderation_threshold = 0.7
        self.enable_auto_response = True
        self.enable_image_generation = True
        self.enable_ai_moderation = True
        self.response_cooldown = 5  # seconds
        self.max_tokens = 150


class AIModeration:
    """AI-powered content moderation"""
    
    def __init__(self, config: AIConfig):
        self.config = config
        self.blocked_patterns = [
            r'(?i)(spam|scam)',
            r'(?i)(hate|racist|slur)',
            r'(?i)(adult|nsfw)',
        ]
        self.warning_threshold = 3
        self.user_warnings: Dict[int, int] = {}
    
    async def check_content(self, content: str, user_id: int) -> Dict[str, Any]:
        """
        Check content for moderation violations
        
        Args:
            content: Text to moderate
            user_id: Discord user ID
            
        Returns:
            Dict with moderation results
        """
        try:
            violation_score = 0.0
            violations = []
            
            # Pattern-based detection
            for pattern in self.blocked_patterns:
                if re.search(pattern, content):
                    violation_score += 0.3
                    violations.append(f"Pattern matched: {pattern}")
            
            # Check for excessive caps
            if len(content) > 5 and sum(1 for c in content if c.isupper()) / len(content) > 0.7:
                violation_score += 0.2
                violations.append("Excessive capitalization")
            
            # Check for spam indicators
            if len(content) > 100 and content.count(' ') < 5:
                violation_score += 0.2
                violations.append("Possible spam pattern")
            
            # Check for repeated characters
            if re.search(r'(.)\1{4,}', content):
                violation_score += 0.1
                violations.append("Repeated characters detected")
            
            violation_score = min(violation_score, 1.0)
            
            return {
                'is_violation': violation_score >= self.config.moderation_threshold,
                'score': violation_score,
                'violations': violations,
                'action': self._determine_action(violation_score, user_id)
            }
        
        except Exception as e:
            logger.error(f"Error checking content: {e}")
            return {
                'is_violation': False,
                'score': 0.0,
                'violations': [],
                'action': 'none'
            }
    
    def _determine_action(self, score: float, user_id: int) -> str:
        """Determine moderation action based on score"""
        if score >= 0.9:
            return 'delete_and_ban'
        elif score >= 0.7:
            self.user_warnings[user_id] = self.user_warnings.get(user_id, 0) + 1
            if self.user_warnings[user_id] >= self.warning_threshold:
                return 'delete_and_kick'
            return 'delete_and_warn'
        elif score >= 0.5:
            return 'delete'
        return 'none'


class ImageGeneration:
    """AI image generation capabilities"""
    
    def __init__(self, config: AIConfig):
        self.config = config
        self.endpoint = "https://api.stability.ai/v1/generation"
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def generate_image(self, prompt: str, style: str = "photorealistic") -> Optional[str]:
        """
        Generate image from text prompt
        
        Args:
            prompt: Text description of image
            style: Style of image (photorealistic, artistic, anime, etc.)
            
        Returns:
            URL of generated image or None
        """
        try:
            if not self.config.stability_api_key:
                logger.warning("Stability API key not configured")
                return None
            
            if self.session is None:
                self.session = aiohttp.ClientSession()
            
            headers = {
                "Authorization": f"Bearer {self.config.stability_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": f"{prompt}, {style} style, high quality, detailed",
                "negative_prompt": "blurry, low quality, distorted",
                "steps": 30,
                "cfg_scale": 7.5,
                "width": 512,
                "height": 512,
                "samples": 1,
                "sampler": "k_euler"
            }
            
            async with self.session.post(
                f"{self.endpoint}/stable-diffusion-v1-6/text-to-image",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if 'artifacts' in data and len(data['artifacts']) > 0:
                        return data['artifacts'][0]['base64']
                else:
                    logger.error(f"Image generation failed: {resp.status}")
            
            return None
        
        except Exception as e:
            logger.error(f"Error generating image: {e}")
            return None
    
    async def close(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()


class AIAutoResponse:
    """AI-powered auto-response system"""
    
    def __init__(self, config: AIConfig):
        self.config = config
        self.responses: Dict[str, List[str]] = {
            'greeting': [
                "Hello! How can I assist you?",
                "Hi there! What can I do for you?",
                "Greetings! What brings you here?",
            ],
            'help': [
                "I'm here to help! What do you need?",
                "Feel free to ask me anything!",
                "I'm ready to assist. What's your question?",
            ],
            'thanks': [
                "You're welcome! Happy to help!",
                "My pleasure! Anything else?",
                "Glad I could help!",
            ],
            'goodbye': [
                "See you later!",
                "Take care!",
                "Goodbye! Have a great day!",
            ]
        }
        self.user_cooldowns: Dict[int, datetime] = {}
    
    async def get_response(self, content: str, user_id: int) -> Optional[str]:
        """
        Generate appropriate auto-response
        
        Args:
            content: User message content
            user_id: Discord user ID
            
        Returns:
            Response string or None
        """
        try:
            # Check cooldown
            if user_id in self.user_cooldowns:
                elapsed = (datetime.utcnow() - self.user_cooldowns[user_id]).total_seconds()
                if elapsed < self.config.response_cooldown:
                    return None
            
            content_lower = content.lower()
            
            # Detect intent
            if any(word in content_lower for word in ['hello', 'hi', 'hey', 'greetings']):
                intent = 'greeting'
            elif any(word in content_lower for word in ['help', 'assist', 'question']):
                intent = 'help'
            elif any(word in content_lower for word in ['thanks', 'thank you', 'appreciate']):
                intent = 'thanks'
            elif any(word in content_lower for word in ['bye', 'goodbye', 'see you']):
                intent = 'goodbye'
            else:
                return None
            
            # Get random response for intent
            import random
            response = random.choice(self.responses[intent])
            
            # Update cooldown
            self.user_cooldowns[user_id] = datetime.utcnow()
            
            return response
        
        except Exception as e:
            logger.error(f"Error generating auto-response: {e}")
            return None


class AdvancedAIFeatures:
    """Advanced AI capabilities"""
    
    def __init__(self, config: AIConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.conversation_history: Dict[int, List[Dict]] = {}
        self.max_history_length = 10
    
    async def generate_response(self, prompt: str, user_id: int, context: str = "") -> Optional[str]:
        """
        Generate AI response with conversation context
        
        Args:
            prompt: User prompt/question
            user_id: Discord user ID
            context: Additional context for response
            
        Returns:
            Generated response or None
        """
        try:
            if self.session is None:
                self.session = aiohttp.ClientSession()
            
            # Maintain conversation history
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = []
            
            # Add to history
            self.conversation_history[user_id].append({
                'role': 'user',
                'content': prompt
            })
            
            # Keep history manageable
            if len(self.conversation_history[user_id]) > self.max_history_length:
                self.conversation_history[user_id].pop(0)
            
            # Build messages with context
            messages = []
            if context:
                messages.append({'role': 'system', 'content': context})
            messages.extend(self.conversation_history[user_id])
            
            # Placeholder for AI API call
            response = await self._call_ai_api(messages)
            
            if response:
                self.conversation_history[user_id].append({
                    'role': 'assistant',
                    'content': response
                })
            
            return response
        
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return None
    
    async def _call_ai_api(self, messages: List[Dict]) -> Optional[str]:
        """
        Call AI API for response generation
        Placeholder implementation - replace with actual API
        """
        try:
            if not self.config.openai_api_key:
                return "AI service not configured. Please set up API keys."
            
            # Example implementation
            return "I'm an AI assistant. This is a placeholder response. Configure your API keys to enable full functionality."
        
        except Exception as e:
            logger.error(f"Error calling AI API: {e}")
            return None
    
    async def sentiment_analysis(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment of text
        
        Returns:
            Dict with sentiment scores (positive, negative, neutral)
        """
        try:
            # Simple sentiment analysis
            positive_words = ['good', 'great', 'awesome', 'love', 'happy', 'excellent']
            negative_words = ['bad', 'hate', 'terrible', 'awful', 'sad', 'angry']
            
            text_lower = text.lower()
            pos_score = sum(1 for word in positive_words if word in text_lower)
            neg_score = sum(1 for word in negative_words if word in text_lower)
            
            total = pos_score + neg_score + 1
            
            return {
                'positive': pos_score / total,
                'negative': neg_score / total,
                'neutral': 1 - (pos_score + neg_score) / total
            }
        
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {'positive': 0.0, 'negative': 0.0, 'neutral': 1.0}
    
    async def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract entities from text (names, dates, locations, etc.)
        
        Returns:
            Dict with extracted entities by type
        """
        try:
            entities = {
                'mentions': re.findall(r'@\w+', text),
                'urls': re.findall(r'http[s]?://\S+', text),
                'emails': re.findall(r'\S+@\S+', text),
                'numbers': re.findall(r'\b\d+\b', text),
            }
            return entities
        
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            return {'mentions': [], 'urls': [], 'emails': [], 'numbers': []}
    
    async def close(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()


class AICog(commands.Cog):
    """Discord bot cog for AI integration"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.config = AIConfig()
        self.moderation = AIModeration(self.config)
        self.image_gen = ImageGeneration(self.config)
        self.auto_response = AIAutoResponse(self.config)
        self.advanced_ai = AdvancedAIFeatures(self.config)
        
        logger.info("AI Integration module initialized")
    
    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        """Monitor messages for moderation and auto-response"""
        if message.author.bot:
            return
        
        # AI Moderation
        if self.config.enable_ai_moderation:
            moderation_result = await self.moderation.check_content(
                message.content,
                message.author.id
            )
            
            if moderation_result['is_violation']:
                action = moderation_result['action']
                
                if action == 'delete':
                    await message.delete()
                    await message.channel.send(
                        f"{message.author.mention} Your message was removed for policy violations."
                    )
                
                elif action == 'delete_and_warn':
                    await message.delete()
                    await message.channel.send(
                        f"{message.author.mention} ⚠️ Warning: Your message violates community guidelines."
                    )
                
                elif action == 'delete_and_kick':
                    await message.delete()
                    try:
                        await message.author.kick(reason="Repeated policy violations")
                        await message.channel.send(
                            f"{message.author.mention} has been kicked for repeated violations."
                        )
                    except discord.Forbidden:
                        await message.channel.send(
                            f"Unable to kick {message.author.mention}. Insufficient permissions."
                        )
        
        # Auto-response
        if self.config.enable_auto_response and not message.author.bot:
            response = await self.auto_response.get_response(
                message.content,
                message.author.id
            )
            if response:
                await message.reply(response)
        
        await self.bot.process_commands(message)
    
    @commands.command(name='ai_generate', help='Generate an image using AI')
    @commands.cooldown(1, 30, commands.BucketType.user)
    async def generate_image(self, ctx: commands.Context, *, prompt: str):
        """Generate image from prompt"""
        if not self.config.enable_image_generation:
            await ctx.send("Image generation is currently disabled.")
            return
        
        async with ctx.typing():
            image_data = await self.image_gen.generate_image(prompt)
            
            if image_data:
                # Send image (base64 would need conversion to file/URL)
                await ctx.send(f"Generated image for: {prompt}")
            else:
                await ctx.send("Failed to generate image. Please check API configuration.")
    
    @commands.command(name='ai_ask', help='Ask the AI a question')
    @commands.cooldown(1, 5, commands.BucketType.user)
    async def ask_ai(self, ctx: commands.Context, *, question: str):
        """Get AI response to question"""
        async with ctx.typing():
            response = await self.advanced_ai.generate_response(
                question,
                ctx.author.id,
                "You are a helpful Discord bot assistant."
            )
            
            if response:
                # Split long responses
                if len(response) > 2000:
                    chunks = [response[i:i+2000] for i in range(0, len(response), 2000)]
                    for chunk in chunks:
                        await ctx.send(chunk)
                else:
                    await ctx.send(response)
            else:
                await ctx.send("Unable to generate response. Please try again later.")
    
    @commands.command(name='ai_sentiment', help='Analyze sentiment of text')
    async def analyze_sentiment(self, ctx: commands.Context, *, text: str):
        """Analyze sentiment of provided text"""
        sentiment = await self.advanced_ai.sentiment_analysis(text)
        
        embed = discord.Embed(
            title="Sentiment Analysis",
            description=f"Analyzing: {text[:100]}...",
            color=discord.Color.blue()
        )
        embed.add_field(
            name="Results",
            value=f"Positive: {sentiment['positive']:.2%}\nNegative: {sentiment['negative']:.2%}\nNeutral: {sentiment['neutral']:.2%}",
            inline=False
        )
        
        await ctx.send(embed=embed)
    
    @commands.command(name='ai_entities', help='Extract entities from text')
    async def extract_entities_cmd(self, ctx: commands.Context, *, text: str):
        """Extract entities from text"""
        entities = await self.advanced_ai.extract_entities(text)
        
        embed = discord.Embed(
            title="Entity Extraction",
            color=discord.Color.green()
        )
        
        for entity_type, values in entities.items():
            if values:
                embed.add_field(
                    name=entity_type.capitalize(),
                    value=", ".join(values),
                    inline=False
                )
        
        await ctx.send(embed=embed)
    
    @commands.command(name='ai_config', help='Configure AI settings')
    @commands.has_permissions(administrator=True)
    async def configure_ai(self, ctx: commands.Context, setting: str, value: str):
        """Configure AI settings (admin only)"""
        settings = {
            'enable_auto_response': lambda v: v.lower() == 'true',
            'enable_image_generation': lambda v: v.lower() == 'true',
            'enable_ai_moderation': lambda v: v.lower() == 'true',
            'moderation_threshold': lambda v: float(v),
            'response_cooldown': lambda v: int(v),
        }
        
        if setting in settings:
            try:
                setattr(self.config, setting, settings[setting](value))
                await ctx.send(f"✅ {setting} set to {value}")
            except ValueError:
                await ctx.send(f"❌ Invalid value for {setting}")
        else:
            await ctx.send(f"❌ Unknown setting: {setting}")
    
    async def cog_unload(self):
        """Clean up resources"""
        await self.image_gen.close()
        await self.advanced_ai.close()
        logger.info("AI Integration module unloaded")


async def setup(bot: commands.Bot):
    """Setup function for cog loading"""
    await bot.add_cog(AICog(bot))
    logger.info("AI Integration cog loaded successfully")
