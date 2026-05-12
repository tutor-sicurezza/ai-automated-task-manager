import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Envelope } from '@phosphor-icons/react';

export function EmailDigestSystem() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Envelope className="mr-2 h-4 w-4" />
          Email Digest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Digest System</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertDescription>
            Email digest system is temporarily disabled. This feature is under maintenance.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
