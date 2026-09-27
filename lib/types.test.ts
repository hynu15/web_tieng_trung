import { describe, expect, it } from 'vitest';
import { questionOptions } from './types';

describe('questionOptions', () => {
  it('đọc mảng phương án của câu trắc nghiệm', () => {
    expect(questionOptions(['Xin chào', 'Cảm ơn'])).toEqual(['Xin chào', 'Cảm ơn']);
  });

  it('câu không phải trắc nghiệm để options null → mảng rỗng', () => {
    expect(questionOptions(null)).toEqual([]);
  });

  it('dữ liệu jsonb không phải mảng cũng trả mảng rỗng, không ném lỗi', () => {
    expect(questionOptions('Xin chào')).toEqual([]);
    expect(questionOptions(42)).toEqual([]);
    expect(questionOptions({ a: 'b' })).toEqual([]);
  });
});
