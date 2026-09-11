"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getPublicEventGuestPath } from "@/lib/constants/events/profile-paths";
import { RsvpForm } from "./RsvpForm";
import type {
  AttendeeCategory,
  CustomRsvpQuestion,
} from "@/types/events";

export interface RsvpDialogProps {
  eventId: number;
  eventTitle: string;
  username: string;
  eventSlug: string;
  atCapacity?: boolean;
  /** When true, RSVP form uses Guest info -> Payment -> Submit steps. */
  paymentsEnabled?: boolean;
  collectionMode?: "offline" | "platform" | "optional";
  contributionAmount?: number | null;
  contributionPaymentInfo?: string | null;
  currency?: string | null;
  capacitySummary?: React.ReactNode;
  triggerLabel?: string;
  customQuestions?: CustomRsvpQuestion[];
  attendeeCategories?: AttendeeCategory[];
  allowAdditionalGuests?: boolean;
  maxAdditionalGuests?: number;
  inviteToken?: string;
  requiresInviteToken?: boolean;
}

export function RsvpDialog({
  eventId,
  eventTitle,
  username,
  eventSlug,
  atCapacity = false,
  paymentsEnabled = false,
  collectionMode = "offline",
  contributionAmount,
  contributionPaymentInfo,
  currency,
  capacitySummary,
  triggerLabel = "Reserve your spot",
  customQuestions = [],
  attendeeCategories = [],
  allowAdditionalGuests = false,
  maxAdditionalGuests = 0,
  inviteToken,
  requiresInviteToken = false,
}: RsvpDialogProps) {
  const [open, setOpen] = useState(false);
  const [rsvpFooter, setRsvpFooter] = useState<ReactNode>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successGuestToken, setSuccessGuestToken] = useState<string | null>(
    null,
  );

  const handleSuccess = useCallback((payload: {
    message?: string;
    guestToken?: string;
  }) => {
    setOpen(false);
    setSuccessGuestToken(payload.guestToken ?? null);
    setSuccessMessage(
      payload.message ??
        "Thank you for your response. We look forward to seeing you!",
    );
  }, []);

  const handleOk = () => {
    setSuccessMessage(null);
    const target = successGuestToken
      ? getPublicEventGuestPath(username, eventSlug, successGuestToken)
      : "/";
    setSuccessGuestToken(null);
    window.location.href = target;
  };

  return (
    <>
      {requiresInviteToken && !inviteToken ? (
        <div className="mb-4 rounded-md border border-warning/30 bg-warning-surface px-3 py-2 text-sm text-warning-deep">
          This private event is invite-only. Please RSVP using your invitation
          link.
        </div>
      ) : null}
      {capacitySummary != null && (
        <p className="mb-4 text-sm font-medium text-foreground">
          {capacitySummary}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              size="lg"
              className="w-full"
              disabled={requiresInviteToken && !inviteToken}
            />
          }
        >
          {requiresInviteToken && !inviteToken
            ? "Invitation required"
            : triggerLabel}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reserve your spot</DialogTitle>
            <DialogDescription>
              Share your name, response, and any notes. You can update your
              response later.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <RsvpForm
              eventId={eventId}
              username={username}
              eventSlug={eventSlug}
              atCapacity={atCapacity}
              paymentsEnabled={paymentsEnabled}
              collectionMode={collectionMode}
              contributionAmount={contributionAmount}
              contributionPaymentInfo={contributionPaymentInfo}
              currency={currency}
              customQuestions={customQuestions}
              attendeeCategories={attendeeCategories}
              allowAdditionalGuests={allowAdditionalGuests}
              maxAdditionalGuests={maxAdditionalGuests}
              inviteToken={inviteToken}
              onSuccess={handleSuccess}
              onFooterChange={setRsvpFooter}
            />
          </DialogBody>
          {rsvpFooter && <DialogFooter>{rsvpFooter}</DialogFooter>}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={successMessage != null}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessMessage(null);
            setSuccessGuestToken(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>RSVP received</AlertDialogTitle>
            <AlertDialogDescription>
              Your RSVP to <strong>{eventTitle}</strong> has been received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row items-center gap-3 sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Want to host your own events?{" "}
              <Link
                href="/signup"
                className="text-primary font-medium underline underline-offset-3 hover:no-underline"
              >
                Sign up
              </Link>
            </p>
            <AlertDialogAction onClick={handleOk}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
