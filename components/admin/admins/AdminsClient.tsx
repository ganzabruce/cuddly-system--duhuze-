"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  grantAdminRoleAction,
  revokeAdminRoleAction,
  promoteAdminAction,
  demoteAdminAction,
} from "@/actions/admin/admins";
import type { AdminUser } from "@/types/admin";
import type { AdminMember } from "@/types/admin";

type SerializedAdminMember = Omit<AdminMember, "createdAt"> & { createdAt: string };

type Props = {
  admins: SerializedAdminMember[];
  currentAdmin: AdminUser;
};

function RoleBadge({ role }: { role: string }) {
  const isOwner = role === "owner";
  return (
    <Badge variant={isOwner ? "warning" : "secondary"}>
      {isOwner ? "Owner" : "Admin"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Disabled"}
    </Badge>
  );
}

export function AdminsClient({ admins, currentAdmin }: Props) {
  const router = useRouter();
  const isOwner = currentAdmin.role === "owner";
  const [error, setError] = useState<string | null>(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] = useState<"admin" | "owner">("admin");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [isGranting, startGranting] = useTransition();

  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);
  const [isRevoking, startRevoking] = useTransition();

  const [isPending, startTransition] = useTransition();

  function handleAction(
    fn: () => Promise<{ success: boolean; error?: string }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setError(result.error ?? "Action failed.");
      } else {
        router.refresh();
      }
    });
  }

  function handleGrantRole() {
    setGrantError(null);
    if (!grantEmail.trim()) { setGrantError("Email is required."); return; }
    startGranting(async () => {
      const result = await grantAdminRoleAction(grantEmail.trim(), grantRole);
      if (!result.success) {
        setGrantError(result.error ?? "Failed to grant role.");
      } else {
        setGrantOpen(false);
        setGrantEmail("");
        setGrantRole("admin");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="rounded-md border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">Admins</h2>
          {isOwner && (
            <Button size="sm" onClick={() => setGrantOpen(true)}>
              Add admin
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Added</TableHead>
              {isOwner && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  No admins yet.
                </TableCell>
              </TableRow>
            )}
            {admins.map((admin) => {
              const isSelf = admin.id === currentAdmin.id;
              return (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="font-medium">{admin.name}</div>
                    <div className="text-xs text-muted-foreground">{admin.email}</div>
                  </TableCell>
                  <TableCell><RoleBadge role={admin.role} /></TableCell>
                  <TableCell className="hidden sm:table-cell"><StatusBadge status={admin.status} /></TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {admin.role === "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleAction(() => promoteAdminAction(admin.id))}
                            >
                              Make owner
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleAction(() => demoteAdminAction(admin.id))}
                            >
                              Make admin
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRevokeTarget(admin.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Grant role dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {grantError && (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {grantError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="grant-email">Email</Label>
              <Input
                id="grant-email"
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground">
                The user must already have an account.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-role">Role</Label>
              <select
                id="grant-role"
                value={grantRole}
                onChange={(e) => setGrantRole(e.target.value as "admin" | "owner")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGrantOpen(false)} disabled={isGranting}>
                Cancel
              </Button>
              <Button onClick={handleGrantRole} disabled={isGranting}>
                {isGranting ? "Granting…" : "Grant role"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm dialog */}
      <AlertDialog open={revokeTarget !== null} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin access</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove admin privileges from this user. They will lose access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRevoking}
              onClick={() => {
                if (revokeTarget === null) return;
                startRevoking(async () => {
                  const result = await revokeAdminRoleAction(revokeTarget);
                  if (!result.success) {
                    setError(result.error ?? "Failed to revoke access.");
                  } else {
                    router.refresh();
                  }
                  setRevokeTarget(null);
                });
              }}
            >
              {isRevoking ? "Revoking…" : "Revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
