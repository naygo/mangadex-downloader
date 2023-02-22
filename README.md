# MangaDex Downloader

MangaDex Downloader is a Node.js CLI project for downloading manga from the MangaDex API. With this script, you can easily download entire manga series or specific volumes for offline reading, with the options of downloading it in ZIP (with raw images) or PDF.

MOBI conversion is supported (available on the develop-kcc branch), but it depends on a private project that uses KCC (Kindle Comic Converter) under the hood. Alternatively, you can install KCC and use the images inside the ZIP file to generate the MOBI file yourself.

## Getting Started

To use MangaDex Downloader, you will need to have Node.js installed on your computer. You can download Node.js from the official website: https://nodejs.org/.

## Usage

To use MangaDex Downloader, you will need to install the dependencies first. To do so, run the following command in the project directory:

```bash
npm install
```

After that, you can run the script with the following command:

```bash
npm start
```

## License

Mangadex Downloader is released under the MIT License. See the LICENSE file for more information.
