import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { userData } from './seedData/user';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    //
    for (const userItem of userData) {
        const { username, email, password, isActive } = userItem;

        const hash = await bcrypt.hash(password, 15);

        const user = await prisma.user.upsert({
            where: { email, username },
            update: {},
            create: {
                username,
                email,
                password: hash,
                isActive,
            },
        });

        console.log(`Created user with email: ${email}`);
    }

    // Create 20 users

    for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                username: faker.internet.username(),
                password: await bcrypt.hash('password', 15),
                isActive: true,
            },
        });

        // make
        console.log(`Created user with email: ${user.email}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
