import {readFileSync, writeFileSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';

/**
 * security/detect-object-injection is disabled here because it is not an issue for this project.
 */
/* eslint-disable security/detect-object-injection */
/**
 * @author SoulHarsh007 <harsh.peshwani@outlook.com>
 * @class ConfParser
 * @description Parses the configuration file and returns the configuration object.
 */
class ConfParser {
  private __source: string;
  private __parsed: Record<string, Record<string, string>[]>;

  constructor() {
    this.__source = '';
    this.__parsed = {
      __DEFAULT__: [],
    };
  }

  /**
   * Parses the configuration file from string.
   * @param {string} config The configuration string to parse.
   */
  public parse(config: string) {
    if (typeof config !== 'string') {
      throw new Error(
        `Expected type of config to be string but got: ${typeof config}`
      );
    }
    this.__source = config;
    if (!config.trim().length) {
      throw new Error('Found 0 length input string');
    }
    let lastSection = '__DEFAULT__';
    config
      .trim()
      .split('\n')
      .forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) {
          this.__parsed[lastSection].push({
            key: '__NEWLINE__',
            value: '',
          });
          return;
        }
        if (line.startsWith('#')) {
          this.__parsed[lastSection].push({
            key: '__COMMENT__',
            value: line,
          });
          return;
        }
        if (trimmedLine.startsWith('[')) {
          const section = trimmedLine.replace(/[[\]]/g, '').trim();
          if (!section.length) {
            throw new Error('Found empty section name');
          }
          this.__parsed[section] = [];
          lastSection = section;
          return;
        }
        if (line.includes('=')) {
          const [key, value] = line.split('=').map(x => x.trim());
          if (!key.length) {
            throw new Error(`Found 0 length key in line: ${line}`);
          }
          if (!value.length) {
            throw new Error(`Found 0 length value in line: ${line}`);
          }
          this.__parsed[lastSection].push({
            key: key.trim(),
            value: value.trim(),
          });
          return;
        }
        if (trimmedLine.split(' ').length === 1) {
          this.__parsed[lastSection].push({
            key: '__SINGLE_OPTION__',
            value: trimmedLine,
          });
        }
      });
  }

  /**
   * get a value from the configuration file.
   *
   * @param {string} section The section to get the value from.
   * @param {string} key The key to get the value from.
   * @param {boolean} hasMany if the key has many values, returns an array if this value is true.
   * @return {string | string[] | undefined}
   */
  public get(
    section: string,
    key: string,
    hasMany = false
  ): string | string[] | undefined {
    if (!this.__parsed[section]) {
      return undefined;
    }
    if (hasMany) {
      return this.__parsed[section]
        .filter((x: Record<string, string>) => x.key === key)
        .map((x: Record<string, string>) => x.value);
    }
    const found = this.__parsed[section].find(
      (x: Record<string, string>) => x.key === key
    );
    return found?.value;
  }

  /**
   * get a section from the configuration file.
   *
   * @param {string} section The section to get the value from.
   * @return {Record<string, string>[] | undefined}
   */
  public getSection(section: string): Record<string, string>[] | undefined {
    return this.__parsed[section];
  }

  /**
   * get all values from the configuration file.
   *
   * @return {Record<string, Record<string, string>[]>}
   */
  public getAll(): Record<string, Record<string, string>[]> {
    return this.__parsed;
  }

  /**
   * get the source string of the configuration file.
   *
   * @return {string}
   */
  public getSource(): string {
    return this.__source;
  }

  /**
   * set a value in the configuration file.
   *
   * @param {string} section The section to set the value to.
   * @param {string} key The key to set the value to.
   * @param {string} value The value to set.
   * @param {boolean} force To force the value to be set, setting this true will push a new entry to the current section. Suitable for adding multiple comments.
   */
  public set(section: string, key: string, value: string, force = false) {
    if (!this.__parsed[section]) {
      this.__parsed[section] = [];
    }
    const found = this.__parsed[section].find(
      (x: Record<string, string>) => x.key === key
    );
    if (found && !force) {
      found.value = value;
    } else {
      this.__parsed[section].push({
        key: key,
        value: value,
      });
    }
  }

  /**
   * deletes a value from the configuration file.
   *
   * @param {string} section The section from which to delete the value.
   * @param {string} key The key to delete
   * @return {undefined}
   */
  public delete(section: string, key: string) {
    if (!this.__parsed[section]) {
      return;
    }
    const found = this.__parsed[section].find(
      (x: Record<string, string>) => x.key === key
    );
    if (found) {
      this.__parsed[section] = this.__parsed[section].filter(
        (x: Record<string, string>) => x.key !== key
      );
    }
  }

  /**
   * deletes a section from the configuration file.
   *
   * @param {string} section The section to delete.
   * @return {boolean}
   */
  public deleteSection(section: string): boolean {
    return delete this.__parsed[section];
  }

  /**
   * converts the configuration object to a string.
   *
   * @return {string}
   */
  public toString(): string {
    let output = '';
    Object.keys(this.__parsed).forEach((section: string) => {
      if (section !== '__DEFAULT__') {
        output += `[${section}]\n`;
      }
      this.__parsed[section].forEach((x: Record<string, string>) => {
        if (x.key === '__NEWLINE__') {
          output += '\n';
          return;
        }
        if (x.key === '__COMMENT__') {
          output += `${x.value}\n`;
          return;
        }
        if (x.key === '__SINGLE_OPTION__') {
          output += `${x.value}\n`;
          return;
        }
        output += `${x.key} = ${x.value}\n`;
      });
    });
    return output;
  }

  /**
   * converts the configuration object to JSON.
   *
   * @return {Record<string, Record<string, string>[]>}
   */
  public toJSON(): Record<string, Record<string, string>[]> {
    return this.__parsed;
  }

  /**
   * Read configuration from a file synchronously.
   *
   * @param {string} file the file path to read from.
   */
  public fromFileSync(file: string) {
    this.parse(readFileSync(file, 'utf8'));
  }

  /**
   * Read configuration from a file asynchronously.
   *
   * @param {string} file the file path to read from.
   */
  public async fromFileAsync(file: string) {
    const data = await readFile(file, 'utf8');
    this.parse(data);
  }

  /**
   * Write configuration from a file synchronously.
   *
   * @param {string} file the file path to write to.
   */
  public saveSync(file: string) {
    writeFileSync(file, this.toString());
  }

  /**
   * Write configuration from a file asynchronously.
   *
   * @param {string} file the file path to write to.
   */
  public async saveAsync(file: string) {
    return writeFile(file, this.toString());
  }
}

export default ConfParser;
