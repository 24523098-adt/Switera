# Backend Express + Prisma untuk mode "Full Docker + hot reload".
# Base Debian slim (bukan Alpine) supaya engine Prisma tidak kena masalah
# musl/openssl. node:22 menyamai versi Node di host (v22).
FROM node:22-slim

# openssl dibutuhkan Prisma query engine saat runtime di Debian slim.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependency dulu (layer cache) — termasuk `prisma` (CLI-nya dipakai
# untuk `migrate deploy` + `generate` di dalam container). --ignore-scripts
# supaya postinstall (prisma generate) tidak terpicu di sini — prisma/
# belum di-COPY, generate eksplisit dijalankan di bawah setelah itu.
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

# Generate Prisma Client memakai engine Linux (Debian) — schema tidak
# mengunci binaryTargets, jadi ini otomatis menghasilkan biner yang benar
# untuk image ini, bukan biner Windows dari host.
COPY prisma ./prisma
RUN npx prisma generate

# Sisa source code (di-.dockerignore-kan: node_modules & .env).
COPY . .

EXPOSE 4000

# Default: jalankan dengan hot reload (node --watch). docker-compose
# meng-override command ini untuk menambahkan migrate + seed lebih dulu.
CMD ["npm", "run", "dev"]
