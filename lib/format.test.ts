import { describe, expect, it } from 'vitest';
import {
  fileExt,
  formatDate,
  isLate,
  isOverdue,
  isoToVnLocal,
  vnLocalToIso,
  youtubeEmbed,
} from './format';

describe('vnLocalToIso', () => {
  it('hiểu ô datetime-local là giờ Việt Nam (UTC+7)', () => {
    expect(vnLocalToIso('2026-05-10T12:25')).toBe('2026-05-10T05:25:00.000Z');
  });

  it('nửa đêm giờ Việt Nam là 17:00 hôm trước theo UTC', () => {
    expect(vnLocalToIso('2026-05-10T00:00')).toBe('2026-05-09T17:00:00.000Z');
  });

  it('ô để trống trả null chứ không phải ngày không hợp lệ', () => {
    expect(vnLocalToIso('')).toBeNull();
    expect(vnLocalToIso(null)).toBeNull();
    expect(vnLocalToIso('   ')).toBeNull();
  });
});

describe('isoToVnLocal', () => {
  it('đổi UTC về giờ Việt Nam đúng dạng ô datetime-local', () => {
    expect(isoToVnLocal('2026-05-10T05:25:00.000Z')).toBe('2026-05-10T12:25');
  });

  it('trả chuỗi rỗng khi không có giá trị', () => {
    expect(isoToVnLocal(null)).toBe('');
    expect(isoToVnLocal(undefined)).toBe('');
  });
});

describe('vnLocalToIso và isoToVnLocal đi hai chiều', () => {
  // Gồm cả mốc giữa năm và cuối năm: Việt Nam không đổi giờ mùa hè nên
  // cả hai phải ra cùng kết quả.
  const mocs = ['2026-01-01T00:00', '2026-05-10T12:25', '2026-07-15T23:59', '2026-12-31T18:30'];

  it.each(mocs)('%s → ISO → về lại chính nó', (local) => {
    const iso = vnLocalToIso(local);
    expect(iso).not.toBeNull();
    expect(isoToVnLocal(iso)).toBe(local);
  });
});

describe('youtubeEmbed', () => {
  const ID = 'dQw4w9WgXcQ';
  const embed = `https://www.youtube.com/embed/${ID}`;

  it.each([
    ['link watch thường', `https://www.youtube.com/watch?v=${ID}`],
    ['link rút gọn youtu.be', `https://youtu.be/${ID}`],
    ['link nhúng sẵn', `https://www.youtube.com/embed/${ID}`],
    ['link shorts', `https://www.youtube.com/shorts/${ID}`],
  ])('%s', (_ten, url) => {
    expect(youtubeEmbed(url)).toBe(embed);
  });

  it('giữ được id khi link có tham số phía sau', () => {
    expect(youtubeEmbed(`https://www.youtube.com/watch?v=${ID}&t=42s`)).toBe(embed);
  });

  it('trả null với link không phải YouTube', () => {
    expect(youtubeEmbed('https://vimeo.com/123456789')).toBeNull();
    expect(youtubeEmbed('https://example.com/bai-giang.pdf')).toBeNull();
  });
});

describe('isOverdue', () => {
  it('mốc đã qua là quá hạn', () => {
    expect(isOverdue(new Date(Date.now() - 60_000).toISOString())).toBe(true);
  });

  it('mốc tương lai chưa quá hạn', () => {
    expect(isOverdue(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it('bài không đặt hạn thì không bao giờ quá hạn', () => {
    expect(isOverdue(null)).toBe(false);
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe('isLate', () => {
  it('nộp sau hạn là trễ', () => {
    expect(isLate('2026-05-10T06:00:00Z', '2026-05-10T05:00:00Z')).toBe(true);
  });

  it('nộp trước hạn không trễ', () => {
    expect(isLate('2026-05-10T04:00:00Z', '2026-05-10T05:00:00Z')).toBe(false);
  });

  it('chưa nộp hoặc bài không có hạn thì không tính là trễ', () => {
    expect(isLate(null, '2026-05-10T05:00:00Z')).toBe(false);
    expect(isLate('2026-05-10T06:00:00Z', null)).toBe(false);
    expect(isLate(null, null)).toBe(false);
  });
});

describe('formatDate', () => {
  it('nói rõ khi bài không có hạn', () => {
    expect(formatDate(null)).toBe('Không có hạn');
    expect(formatDate(undefined)).toBe('Không có hạn');
  });

  it('hiển thị theo giờ Việt Nam', () => {
    // 05:25 UTC = 12:25 giờ Việt Nam, ngày 10/05/2026.
    const out = formatDate('2026-05-10T05:25:00.000Z');
    expect(out).toContain('12:25');
    expect(out).toContain('10/05');
  });
});

describe('fileExt', () => {
  it('lấy đuôi từ tên file và viết thường', () => {
    expect(fileExt(new File([], 'bai-viet.JPG', { type: 'image/jpeg' }))).toBe('jpg');
  });

  it('tên file không có đuôi thì suy từ kiểu MIME', () => {
    expect(fileExt(new File([], 'ghi-am', { type: 'audio/webm;codecs=opus' }))).toBe('webm');
  });

  it('không biết gì thì trả bin', () => {
    expect(fileExt(new File([], 'khong-ro', { type: '' }))).toBe('bin');
  });
});
