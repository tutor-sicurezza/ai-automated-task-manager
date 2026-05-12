import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Envelope } from '@phosphor-icons/react';

export function EmailDigestSystem() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Envelope className="mr-2 h-4 w-4" weight="bold" />
          Email Digests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Digest System</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertDescription>
            Email digest system is temporarily disabled. This feature will be rebuilt soon with improved functionality.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
