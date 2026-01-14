/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Menggunakan paket baru untuk v4
    autoprefixer: {},
  },
};

export default config;