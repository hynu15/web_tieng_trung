import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Ảnh bài viết tay và file ghi âm đi qua server action
    serverActions: { bodySizeLimit: '12mb' },
  },
};

export default nextConfig;
