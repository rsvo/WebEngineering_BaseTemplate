import type { ReactElement } from 'react';
import { Highlight } from '../search/Highlight';
import { BEAR_TYPE_COLUMNS, BEAR_TYPE_ROWS } from './bearTypes';

interface BearTypesTableProps {
  query: string;
}

export function BearTypesTable({ query }: BearTypesTableProps): ReactElement {
  return (
    <table>
      <thead>
        <tr>
          {BEAR_TYPE_COLUMNS.map((column) => (
            <td key={column.key}>
              <Highlight text={column.label} query={query} />
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {BEAR_TYPE_ROWS.map((row) => (
          <tr key={row.type}>
            {BEAR_TYPE_COLUMNS.map((column) => (
              <td key={column.key}>
                <Highlight text={row[column.key]} query={query} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
