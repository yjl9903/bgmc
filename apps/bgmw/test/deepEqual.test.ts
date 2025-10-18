import { describe, it, expect } from 'vitest';

import { deepEqual } from '../src/subject/utils';

describe('deepEqual', () => {
  it('应该正确比较基本类型', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('hello', 'hello')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);

    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('hello', 'world')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('应该正确比较数组', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);

    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
  });

  it('应该正确比较对象', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);

    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true); // 属性顺序不影响比较
  });

  it('应该正确比较嵌套结构', () => {
    const obj1 = {
      id: 1,
      data: {
        title: 'Test',
        tags: ['tag1', 'tag2'],
        metadata: {
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-02')
        }
      }
    };

    const obj2 = {
      id: 1,
      data: {
        title: 'Test',
        tags: ['tag1', 'tag2'],
        metadata: {
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-02')
        }
      }
    };

    const obj3 = {
      id: 1,
      data: {
        title: 'Test',
        tags: ['tag1', 'tag3'], // 不同的标签
        metadata: {
          created: new Date('2023-01-01'),
          updated: new Date('2023-01-02')
        }
      }
    };

    expect(deepEqual(obj1, obj2)).toBe(true);
    expect(deepEqual(obj1, obj3)).toBe(false);
  });

  it('应该正确处理 Date 对象', () => {
    const date1 = new Date('2023-01-01');
    const date2 = new Date('2023-01-01');
    const date3 = new Date('2023-01-02');

    expect(deepEqual(date1, date2)).toBe(true);
    expect(deepEqual(date1, date3)).toBe(false);
  });

  it('应该正确处理混合类型', () => {
    const mixed1 = {
      string: 'test',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: true },
      date: new Date('2023-01-01'),
      null: null,
      undefined: undefined
    };

    const mixed2 = {
      string: 'test',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: true },
      date: new Date('2023-01-01'),
      null: null,
      undefined: undefined
    };

    const mixed3 = {
      string: 'test',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: false }, // 不同的值
      date: new Date('2023-01-01'),
      null: null,
      undefined: undefined
    };

    expect(deepEqual(mixed1, mixed2)).toBe(true);
    expect(deepEqual(mixed1, mixed3)).toBe(false);
  });
});
