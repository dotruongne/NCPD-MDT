/**
 * In-Memory Sliding Window Rate Limiter
 * Tối ưu cho Next.js Node.js runtime / server actions / API routes
 */

type RateLimitRecord = {
  tokens: number;
  lastRefill: number;
};

// Global cache lưu trạng thái request theo key (IP + endpoint)
const tracker = new Map<string, RateLimitRecord>();

// Định kỳ dọn dẹp các IP không hoạt động quá 10 phút để tránh rò rỉ bộ nhớ
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now - record.lastRefill > 10 * 60 * 1000) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export type RateLimitOptions = {
  /** Số lượng request tối đa trong khoảng thời gian */
  limit: number;
  /** Thời gian của window (tính bằng giây) */
  windowSeconds: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetSeconds: number;
};

/**
 * Kiểm tra và áp dụng Rate Limit theo key định danh (thường là IP hoặc Identifier)
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowSeconds } = options;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = tracker.get(key);

  if (!record) {
    record = {
      tokens: limit - 1,
      lastRefill: now,
    };
    tracker.set(key, record);
    return {
      success: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  // Tính lượng token được hồi phục theo thời gian trôi qua (Token Bucket / Leaky Bucket)
  const timeElapsed = now - record.lastRefill;
  if (timeElapsed >= windowMs) {
    // Reset window mới
    record.tokens = limit - 1;
    record.lastRefill = now;
    return {
      success: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    const resetSeconds = Math.ceil((windowMs - timeElapsed) / 1000);
    return {
      success: true,
      remaining: record.tokens,
      resetSeconds,
    };
  }

  // Đã hết quota
  const resetSeconds = Math.ceil((windowMs - timeElapsed) / 1000);
  return {
    success: false,
    remaining: 0,
    resetSeconds,
  };
}
