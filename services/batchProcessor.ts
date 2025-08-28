/**
 * Batch processor for database operations to improve performance
 * Groups multiple operations together and executes them in batches
 */

export class BatchProcessor {
  private static batches: Map<string, any[]> = new Map();
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static readonly BATCH_TIMEOUT = 100; // Process batch after 100ms
  private static readonly MAX_BATCH_SIZE = 50; // Process batch if it reaches 50 items
  
  /**
   * Add an operation to a batch for later processing
   */
  static addToBatch(type: string, operation: () => Promise<any>) {
    if (!this.batches.has(type)) {
      this.batches.set(type, []);
    }
    
    const batch = this.batches.get(type)!;
    batch.push(operation);
    
    // Process immediately if batch size limit reached
    if (batch.length >= this.MAX_BATCH_SIZE) {
      this.processBatch(type);
      return;
    }
    
    // Clear existing timer
    if (this.timers.has(type)) {
      clearTimeout(this.timers.get(type)!);
    }
    
    // Set new timer to process batch
    const timer = setTimeout(() => this.processBatch(type), this.BATCH_TIMEOUT);
    this.timers.set(type, timer);
  }
  
  /**
   * Process all operations in a batch
   */
  private static async processBatch(type: string) {
    const batch = this.batches.get(type) || [];
    if (batch.length === 0) return;
    
    // Clear the batch and timer
    this.batches.set(type, []);
    const timer = this.timers.get(type);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(type);
    }
    
    console.log(`🔄 Processing batch of ${batch.length} ${type} operations`);
    
    try {
      // Process all operations in parallel
      const results = await Promise.allSettled(batch.map(op => op()));
      
      // Log any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error(`❌ ${failures.length} operations failed in ${type} batch:`, failures);
      } else {
        console.log(`✅ Successfully processed ${batch.length} ${type} operations`);
      }
    } catch (error) {
      console.error(`❌ Batch processing failed for ${type}:`, error);
    }
  }
  
  /**
   * Force process all pending batches immediately
   */
  static async flushAll() {
    const batchTypes = Array.from(this.batches.keys());
    await Promise.all(batchTypes.map(type => this.processBatch(type)));
  }
  
  /**
   * Get current batch statistics
   */
  static getStats() {
    const stats: Record<string, number> = {};
    for (const [type, batch] of this.batches.entries()) {
      stats[type] = batch.length;
    }
    return stats;
  }
}

/**
 * Convenience functions for common batch operations
 */
export class ChatBatchProcessor {
  /**
   * Batch save message operations
   */
  static saveMessage(chatId: string, message: any) {
    return new Promise((resolve, reject) => {
      BatchProcessor.addToBatch('save-message', async () => {
        try {
          // Import Chat model directly to avoid circular dependencies
          const Chat = (await import('../models/Chat')).default;
          const chat = await Chat.findOne({ id: chatId, isActive: true });
          if (!chat) {
            throw new Error('Chat not found');
          }
          
          const newMessage = {
            role: message.role,
            content: message.content || '',
            timestamp: new Date(),
            files: message.files || [],
            parts: message.parts || [],
            metadata: message.metadata || {}
          };
          
          chat.messages.push(newMessage);
          chat.updatedAt = new Date();
          await chat.save();
          
          resolve(newMessage);
          return newMessage;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
    });
  }
  
  /**
   * Batch memory operations
   */
  static saveMemory(userId: string, message: any, metadata?: any) {
    return new Promise((resolve, reject) => {
      BatchProcessor.addToBatch('save-memory', async () => {
        try {
          // Import memory service dynamically
          const { addMemories } = await import('@mem0/vercel-ai-provider');
          const result = await addMemories([message], { 
            user_id: userId,
            mem0ApiKey: process.env.MEM0_API_KEY,
            metadata 
          });
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
    });
  }
}
