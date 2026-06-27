"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string | null;
  accessLevel: string;
  status: string;
  lastLogin: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <TopBar title="Users" subtitle={`${users.length} users from Release Desk seed data`} />
      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : (
        <DataTable title="All Users" subtitle="100 user records from sample workbook" icon={Users}>
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className={`sticky top-0 z-10 ${tableHeadRow}`}>
                <tr>
                  <th className={`${tableCell} text-left font-medium`}>User ID</th>
                  <th className={`${tableCell} text-left font-medium`}>Name</th>
                  <th className={`${tableCell} text-left font-medium`}>Email</th>
                  <th className={`${tableCell} text-left font-medium`}>Role</th>
                  <th className={`${tableCell} text-left font-medium`}>Department</th>
                  <th className={`${tableCell} text-left font-medium`}>Manager</th>
                  <th className={`${tableCell} text-left font-medium`}>Access Level</th>
                  <th className={`${tableCell} text-left font-medium`}>Status</th>
                  <th className={`${tableCell} text-left font-medium`}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id} className={tableRow}>
                    <td className={`${tableCell} font-mono text-gray-600`}>{row.userId}</td>
                    <td className={`${tableCell} font-medium text-gray-800`}>{row.name}</td>
                    <td className={tableCell}>{row.email}</td>
                    <td className={tableCell}>{row.role}</td>
                    <td className={tableCell}>{row.department}</td>
                    <td className={tableCell}>{row.manager ?? "—"}</td>
                    <td className={tableCell}>{row.accessLevel}</td>
                    <td className={tableCell}>{row.status}</td>
                    <td className={tableCell}>{row.lastLogin ? formatDate(row.lastLogin) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
