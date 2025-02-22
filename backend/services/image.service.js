const sharp = require('sharp');
const logger = require('../utils/logger');

class ImageService {
  constructor() {
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp'
    ];
  }

  async processImage(imageBuffer, options = {}) {
    try {
      const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'webp'
      } = options;

      const processedImage = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality });

      const outputBuffer = await processedImage.toBuffer();
      
      return {
        data: outputBuffer.toString('base64'),
        type: `image/${format}`,
        size: outputBuffer.length
      };
    } catch (error) {
      logger.error('Erro ao processar imagem:', error);
      throw new Error('Erro ao processar imagem');
    }
  }

  async processFavicon(imageBuffer) {
    try {
      // Processar favicon em múltiplos tamanhos
      const sizes = [16, 32, 48];
      const faviconBuffers = await Promise.all(
        sizes.map(size =>
          sharp(imageBuffer)
            .resize(size, size)
            .toFormat('png')
            .toBuffer()
        )
      );

      // Usar o menor tamanho como padrão
      return {
        data: faviconBuffers[0].toString('base64'),
        type: 'image/png',
        size: faviconBuffers[0].length
      };
    } catch (error) {
      logger.error('Erro ao processar favicon:', error);
      throw new Error('Erro ao processar favicon');
    }
  }

  async validateImage(imageBuffer, mimeType) {
    try {
      if (!this.allowedMimeTypes.includes(mimeType)) {
        throw new Error('Tipo de imagem não permitido');
      }

      const metadata = await sharp(imageBuffer).metadata();
      
      if (metadata.width > 3000 || metadata.height > 3000) {
        throw new Error('Imagem muito grande. Máximo permitido: 3000x3000px');
      }

      if (imageBuffer.length > 5 * 1024 * 1024) { // 5MB
        throw new Error('Arquivo muito grande. Máximo permitido: 5MB');
      }

      return true;
    } catch (error) {
      logger.error('Erro na validação da imagem:', error);
      throw error;
    }
  }

  async optimizeDeviceImage(imageBuffer, mimeType) {
    try {
      await this.validateImage(imageBuffer, mimeType);

      return this.processImage(imageBuffer, {
        width: 400,
        height: 300,
        quality: 80,
        format: 'webp'
      });
    } catch (error) {
      logger.error('Erro ao otimizar imagem do dispositivo:', error);
      throw error;
    }
  }

  async optimizeLogo(imageBuffer, mimeType) {
    try {
      await this.validateImage(imageBuffer, mimeType);

      return this.processImage(imageBuffer, {
        width: 800,
        height: 200,
        quality: 90,
        format: 'webp'
      });
    } catch (error) {
      logger.error('Erro ao otimizar logo:', error);
      throw error;
    }
  }

  getDefaultDeviceImage() {
    // Retornar uma imagem padrão para dispositivos
    return {
      data: 'BASE64_DEFAULT_DEVICE_IMAGE',
      type: 'image/svg+xml'
    };
  }

  getDefaultLogo() {
    // Retornar uma logo padrão
    return {
      data: 'BASE64_DEFAULT_LOGO',
      type: 'image/svg+xml'
    };
  }

  getDefaultFavicon() {
    // Retornar um favicon padrão
    return {
      data: 'BASE64_DEFAULT_FAVICON',
      type: 'image/png'
    };
  }
}

module.exports = new ImageService();