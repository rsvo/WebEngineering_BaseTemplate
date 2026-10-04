export type BearTypeColumn =
  'type' | 'coat' | 'size' | 'habitat' | 'lifespan' | 'diet';

export type BearTypeRow = Record<BearTypeColumn, string>;

export const BEAR_TYPE_COLUMNS: ReadonlyArray<{
  key: BearTypeColumn;
  label: string;
}> = [
  { key: 'type', label: 'Bear Type' },
  { key: 'coat', label: 'Coat' },
  { key: 'size', label: 'Adult size' },
  { key: 'habitat', label: 'Habitat' },
  { key: 'lifespan', label: 'Lifespan' },
  { key: 'diet', label: 'Diet' },
];

export const BEAR_TYPE_ROWS: readonly BearTypeRow[] = [
  {
    type: 'Wild',
    coat: 'Brown or black',
    size: '1.4 to 2.8 meters',
    habitat: 'Woods and forests',
    lifespan: '25 to 28 years',
    diet: 'Fish, meat, plants',
  },
  {
    type: 'Urban',
    coat: 'North Face',
    size: '18 to 22',
    habitat: 'Condos and coffee shops',
    lifespan: '20 to 32 years',
    diet: 'Starbucks, sushi',
  },
];
