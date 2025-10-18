/**
 * 深度比较两个值是否相等
 * 支持对象、数组、基本类型的深度比较
 * @param a 第一个值
 * @param b 第二个值
 * @returns 是否相等
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // 严格相等检查（包括 null, undefined, 基本类型）
  if (a === b) {
    return true;
  }

  // 如果其中一个是 null 或 undefined，另一个不是，则不相等
  if (a == null || b == null) {
    return a === b;
  }

  // 类型不同则不相等
  if (typeof a !== typeof b) {
    return false;
  }

  // 处理 Date 对象
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 处理数组
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // 处理对象
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  // 其他情况（基本类型）不相等
  return false;
}
