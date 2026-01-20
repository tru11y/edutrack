import type { ReactNode } from "react";

interface Props {
  headers: string[];
  children: ReactNode;
}

export function Table({ headers, children }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 bg-white">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="p-2 border-b text-left text-sm font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
