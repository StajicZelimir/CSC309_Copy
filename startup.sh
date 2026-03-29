set -e

npm install
npx prisma generate
if [ ! -d "prisma/migrations" ]; then
    npx prisma migrate reset --force
    npx prisma migrate dev --name init_db
    if [ ! -x "./import-data.sh" ]; then
        chmod +x import-data.sh
    fi

    ./import-data.sh
    # echo "INSERT INTO \"User\" (uid, email, password, username, role) VALUES (0, 'system@admin.com', '\$2b\$04\$hg1RELPlttg0CkGz7Uige.Xeca4G.NVAK9za68H6bzrqxA453fvt6', 'SystemAdmin', 'admin') ON CONFLICT (uid) DO NOTHING;" | npx prisma db execute --stdin --schema ./prisma/schema.prisma
fi

npx tsx scripts/db_init.ts
npm run dev:all
