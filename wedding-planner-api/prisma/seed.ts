import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Role } from '../src/common/enums/role.enum';
import { seedMarketingContent } from './seed-marketing';

const prisma = new PrismaClient();

const SEED_ASSETS_DIR = join(__dirname, 'seed-assets');
const UPLOADS_DIR = join(process.cwd(), 'uploads');

/**
 * Copies a tracked seed asset into the (git-ignored) uploads dir if it is not
 * already present, so seeded Photo rows always resolve to a real file on disk.
 */
function ensureUploadExists(url: string): void {
  const fileName = basename(url);
  const source = join(SEED_ASSETS_DIR, fileName);
  const dest = join(UPLOADS_DIR, fileName);
  if (!existsSync(source)) {
    console.warn(`Seed asset missing, skipping copy: ${source}`);
    return;
  }
  mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!existsSync(dest)) {
    copyFileSync(source, dest);
  }
}

const PASSWORD_SALT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, PASSWORD_SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  await prisma.siteContent.upsert({
    where: { key: 'home.hero' },
    update: {},
    create: {
      key: 'home.hero',
      title: 'Your Perfect Day, Perfectly Planned',
      body: 'We help couples design and host weddings they will remember forever. From intimate ceremonies to grand celebrations, our team takes care of every detail.',
    },
  });

  await prisma.siteContent.upsert({
    where: { key: 'home.about' },
    update: {},
    create: {
      key: 'home.about',
      title: 'About Us',
      body: 'With years of experience planning weddings, our team combines creativity, organization, and care to bring your vision to life. Reach out and let us help you plan the celebration of a lifetime.',
    },
  });

  const samplePhotos = [
    {
      url: '/uploads/sample-1.png',
      alt: 'Wedding ceremony under string lights',
      caption: 'Evening ceremony setup',
      order: 0,
    },
    {
      url: '/uploads/sample-2.png',
      alt: 'Reception table with floral centerpieces',
      caption: 'Reception decor',
      order: 1,
    },
  ];

  // Remove legacy sample rows that pointed at .jpg files which were never on disk.
  await prisma.photo.deleteMany({
    where: { url: { in: ['/uploads/sample-1.jpg', '/uploads/sample-2.jpg'] } },
  });

  for (const photo of samplePhotos) {
    ensureUploadExists(photo.url);
    const existing = await prisma.photo.findFirst({ where: { url: photo.url } });
    if (!existing) {
      await prisma.photo.create({ data: photo });
    }
  }

  // Opening hours for the booking calendar. Created once; later edits made in
  // the admin panel are preserved on re-seed.
  await prisma.availabilitySetting.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  await prisma.blogPost.upsert({
    where: { slug: 'welcome-to-our-blog' },
    update: {},
    create: {
      slug: 'welcome-to-our-blog',
      title: 'Welcome to Our Blog',
      excerpt: 'A few words on what to expect from our wedding planning journal.',
      content:
        'Welcome! On this blog we will share tips, inspiration, and stories from the weddings we plan. Check back often for new posts.',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  await seedMarketingContent(prisma);

  console.log('Seed complete.');
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
