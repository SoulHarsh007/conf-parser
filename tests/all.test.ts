import {expect} from 'chai';
import {rmSync, readFileSync} from 'fs';
import {describe, it} from 'mocha';
import ConfParser from '../src/index';

const testConfig = `# comment
key1 = value1
key2 = value2
[section1]
key3 = value3
key4 = value4
[section2]
key5 = value5
key6 = value6

# pacman like syntax
Color
CheckSpace
`;
const conf = new ConfParser();
conf.parse(testConfig);

describe('Testing ConfParser.parse()...', (): void => {
  const conf2 = new ConfParser();
  it('.parse() should throw an error if something other than string is provided', (): void => {
    expect(() => conf2.parse(null)).to.throw(Error);
  });

  it('.parse() should throw an error if 0 length string is provided', (): void => {
    expect(() => conf2.parse('')).to.throw(Error);
  });

  it('.parse() should throw an error if 0 length section is provided', (): void => {
    expect(() => conf2.parse('[]')).to.throw(Error);
  });

  it('.parse() should throw an error if 0 length key is provided', (): void => {
    expect(() => conf2.parse('=test')).to.throw(Error);
  });

  it('.parse() should throw an error if 0 length value is provided', (): void => {
    expect(() => conf2.parse('test=')).to.throw(Error);
  });
});

describe('Testing ConfParser.get()...', (): void => {
  it('.get() should return a string', (): void => {
    expect(conf.get('section1', 'key3', false)).to.be.an(
      'string',
      `expected string, got ${typeof conf.get('section1', 'key3', false)}`
    );
  });

  it('.get() should return undefined if value not found', (): void => {
    expect(conf.get('section2', 'key3', false)).to.be.undefined;
  });

  it('.get() should return undefined if section not found', (): void => {
    expect(conf.get('section9', 'key3', false)).to.be.undefined;
  });

  it('.get() with hasMany set to true should return a string array', (): void => {
    expect(conf.get('section1', 'key3', true)).to.be.an(
      'array',
      `expected array ([value3]), got ${typeof conf.get(
        'section1',
        'key3',
        true
      )}`
    );
    expect(conf.get('section1', 'key3', true)).to.be.deep.equal(
      ['value3'],
      `expected [value3], got ${conf.get('section1', 'key3', true)}`
    );
  });
});

describe('Testing ConfParser.getSection...', (): void => {
  it('.getSection() returns an array', (): void => {
    expect(conf.getSection('section1')).to.be.an('array');
    expect(conf.getSection('section1')).to.have.lengthOf(
      2,
      'section1 should have 2 entries'
    );
  });

  it('.getSection() array contains an object with key and value', (): void => {
    expect(conf.getSection('section1')[0]).to.be.an(
      'object',
      `expected object, got ${typeof conf.getSection('section1')[0]}`
    );
    expect(conf.getSection('section1')[0]).to.have.property(
      'key',
      'key3',
      'key3 should be key'
    );
    expect(conf.getSection('section1')[0]).to.have.property(
      'value',
      'value3',
      'value3 should be value'
    );
    expect(Object.keys(conf.getSection('section1')[0])).to.have.lengthOf(
      2,
      'section1[0] should have 2 properties'
    );
  });
});

describe('Testing ConfParser.getAll()...', (): void => {
  it('getAll() should return an object', (): void => {
    expect(conf.getAll()).to.be.an('object');
  });

  it('__DEFAULT__ should have 3 entries', (): void => {
    expect(conf.getAll().__DEFAULT__).to.have.lengthOf(3);
  });

  it('section1 should have 2 values', (): void => {
    expect(conf.getAll().section1).to.have.lengthOf(2);
  });

  it('section2 should have 6 values', (): void => {
    expect(conf.getAll().section2).to.have.lengthOf(6);
  });
});

describe('Testing ConfParser.getSource()...', (): void => {
  it('getSource() should return a string identical to testConf', (): void => {
    expect(conf.getSource()).to.be.an(
      'string',
      `expected string, got ${typeof conf.getSource()}`
    );
    expect(conf.getSource()).to.be.equal(
      testConfig,
      'source should be testConfig'
    );
  });
});

describe('Testing ConfParser.set()...', (): void => {
  it('.set() can create a new section', (): void => {
    expect(conf.set('section3', 'section3-key1', 'section3-value0')).to.be
      .undefined;
    expect(conf.getSection('section3')).to.be.an('array');
  });

  it('.set() can create new values', (): void => {
    expect(conf.set('section3', 'section3-key2', 'section3-value2', false)).to
      .be.undefined;
    expect(conf.getSection('section3')).to.be.an('array');
  });

  it('.set() can update existing values', (): void => {
    expect(conf.set('section3', 'section3-key1', 'section3-value1', false)).to
      .be.undefined;
    expect(conf.getSection('section3')).to.be.an('array');
  });

  it('can access newly set values', (): void => {
    expect(conf.get('section3', 'section3-key1')).to.be.equal(
      'section3-value1'
    );
  });
});

describe('Testing ConfParser.delete()...', (): void => {
  conf.set('section3', '__COMMENT__', 'section3-value1', true);
  conf.set('section3', '__COMMENT__', 'section3-value1', true);

  it('.delete() should return undefined even if value does not exist', (): void => {
    expect(conf.delete('section4', 'section3-key1')).to.be.undefined;
  });

  it('Check length of newly added section', (): void => {
    expect(conf.getSection('section3')).to.have.lengthOf(4);
  });

  it('Check length after deleting values from section', (): void => {
    conf.delete('section3', '__COMMENT__');
    expect(conf.getSection('section3')).to.have.lengthOf(2);
  });
});

describe('Testing ConfParser.deleteSection()...', (): void => {
  it('.deleteSection() should remove the newly created section and return true', (): void => {
    expect(conf.deleteSection('section3')).to.be.true;
    expect(conf.getSection('section3')).to.be.undefined;
  });
});

describe('Testing ConfParser.toString()...', (): void => {
  it('.toString() returns same string as input', (): void => {
    expect(conf.toString()).to.be.an(
      'string',
      `expected string, got ${typeof conf.toString()}`
    );
    expect(conf.toString()).to.be.equal(
      testConfig,
      `expected ${testConfig}, got ${conf.toString()}`
    );
  });
});

describe('Testing ConfParser.toJSON()...', (): void => {
  it('.toJSON() returns an object', (): void => {
    expect(conf.toJSON()).to.be.an('object');
  });
});

describe('Testing ConfParser.fromFileAsync()...', (): void => {
  const conf2 = new ConfParser();
  it('.fromFileAsync is able to read the file', async () => {
    await conf2.fromFileAsync('./tests/test.conf');
    expect(conf2.get('section1', 'key3')).to.be.equal('value3');
    expect(conf2.get('section1', 'key4')).to.be.equal('value4');
    expect(conf2.get('section2', 'key5')).to.be.equal('value5');
    expect(conf2.get('section2', 'key6')).to.be.equal('value6');
  });
});

describe('Testing ConfParser.fromFileSync()...', (): void => {
  const conf2 = new ConfParser();
  it('.fromFileSync is able to read the file', () => {
    expect(conf2.fromFileSync('./tests/test.conf')).to.be.undefined;
    expect(conf2.get('section1', 'key3')).to.be.equal('value3');
    expect(conf2.get('section1', 'key4')).to.be.equal('value4');
    expect(conf2.get('section2', 'key5')).to.be.equal('value5');
    expect(conf2.get('section2', 'key6')).to.be.equal('value6');
  });
});

describe('Testing ConfParser.saveAsync()...', (): void => {
  it('.saveAsync() is able to save the file', async () => {
    await conf.saveAsync('./test.2.conf');
    expect(readFileSync('./test.2.conf').toString('utf8')).to.be.equal(
      testConfig
    );
  });
}).afterAll(() => {
  rmSync('./test.2.conf', {force: true});
});

describe('Testing ConfParser.saveSync()...', (): void => {
  it('.saveSync() is able to save the file', () => {
    conf.saveSync('./test.2.conf');
    expect(readFileSync('./test.2.conf').toString('utf8')).to.be.equal(
      testConfig
    );
  });
}).afterAll(() => {
  rmSync('./test.2.conf', {force: true});
});
