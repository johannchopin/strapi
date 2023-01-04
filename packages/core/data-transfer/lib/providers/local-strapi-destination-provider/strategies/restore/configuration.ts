import { Writable } from 'stream';
import chalk from 'chalk';
import { IConfiguration } from '../../../../../types';

const restoreCoreStore = async <T extends { value: unknown }>(strapi: Strapi.Strapi, data: T) => {
  // @ts-ignore
  delete data.id;
  return strapi.db.query('strapi::core-store').create({
    data: {
      ...data,
      value: JSON.stringify(data.value),
    },
  });
};

const restoreWebhooks = async (strapi: Strapi.Strapi, data: unknown) => {
  // @ts-ignore
  delete data.id;
  return strapi.db.query('webhook').create({ data });
};

export const restoreConfigs = async (strapi: Strapi.Strapi, config: IConfiguration) => {
  if (config.type === 'core-store') {
    return restoreCoreStore(strapi, config.value as { value: unknown });
  }

  if (config.type === 'webhook') {
    return restoreWebhooks(strapi, config.value);
  }
};

export const createConfigurationWriteStream = async (strapi: Strapi.Strapi) => {
  return new Writable({
    objectMode: true,
    async write<T extends { id: number }>(
      config: IConfiguration<T>,
      _encoding: BufferEncoding,
      callback: (error?: Error | null) => void
    ) {
      try {
        await restoreConfigs(strapi, config);
      } catch (error) {
        return callback(
          new Error(
            `Failed to import ${chalk.yellowBright(config.type)} (${chalk.greenBright(error)}`
          )
        );
      }
      callback();
    },
  });
};
