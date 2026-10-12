import * as migration_20261012_161400 from './20261012_161400';

export const migrations = [
  {
    up: migration_20261012_161400.up,
    down: migration_20261012_161400.down,
    name: '20261012_161400'
  },
];
